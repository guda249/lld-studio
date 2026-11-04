import threading


class ReadWriteLock:
    def __init__(self) -> None:
        self._cond = threading.Condition()
        self._readers = 0
        self._writing = False

    def acquire_read(self) -> None:
        with self._cond:
            while self._writing:
                self._cond.wait()
            self._readers += 1

    def release_read(self) -> None:
        with self._cond:
            self._readers -= 1
            self._cond.notify_all()

    def acquire_write(self) -> None:
        with self._cond:
            while self._writing or self._readers:
                self._cond.wait()
            self._writing = True

    def release_write(self) -> None:
        with self._cond:
            self._writing = False
            self._cond.notify_all()


class FareCache:
    """Many searches read cached fares; a miss asks the airline (slow) and fills the cache."""

    def __init__(self, check_again: bool) -> None:
        self._lock = ReadWriteLock()
        self.fares: dict[str, int] = {}
        self.check_again = check_again
        self.airline_calls = 0

    def fare(self, route: str, saw_miss: threading.Barrier) -> int:
        self._lock.acquire_read()
        try:
            cached = self.fares.get(route)
        finally:
            self._lock.release_read()
        if cached is not None:
            return cached
        saw_miss.wait()  # demo only: now every search has seen the miss
        self._lock.acquire_write()  # a read lock cannot be upgraded: let go, then take the write lock
        try:
            if self.check_again and route in self.fares:
                return self.fares[route]  # another search filled it while we waited
            self.airline_calls += 1
            self.fares[route] = 5400  # stands in for the slow airline call
            return self.fares[route]
        finally:
            self._lock.release_write()


def run(searches: int, warm: bool, check_again: bool) -> str:
    cache = FareCache(check_again)
    if warm:
        cache.fares["BLR-DEL"] = 5400
    saw_miss = threading.Barrier(searches, timeout=2)
    threads = [threading.Thread(target=cache.fare, args=("BLR-DEL", saw_miss)) for _ in range(searches)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    return f"airline called {cache.airline_calls} time{'' if cache.airline_calls == 1 else 's'}"


for label, searches, warm in [("1 search", 1, False), ("4 searches", 4, False), ("4 searches, warm cache", 4, True)]:
    for check_again in [True, False]:
        rule = "check again" if check_again else "no re-check"
        print(f"{label}, {rule}: {run(searches, warm, check_again)}")
