import threading


class DbPool:
    _instance: "DbPool | None" = None
    _lock = threading.Lock()
    created = 0

    def __init__(self) -> None:
        DbPool.created += 1
        self.connections = 10  # imagine opening 10 real database connections here

    @classmethod
    def get(cls, pause: threading.Barrier | None = None) -> "DbPool":
        if cls._instance is None:  # 1st check, no lock: the fast path once it exists
            if pause is not None:
                pause.wait()  # demo only: both threads pass the 1st check together
            with cls._lock:  # one thread at a time from here
                if cls._instance is None:  # 2nd check: did someone create it while we waited?
                    cls._instance = DbPool()
        return cls._instance


race = threading.Barrier(2, timeout=2)
pools: list[DbPool] = []
threads = [threading.Thread(target=lambda: pools.append(DbPool.get(race))) for _ in range(2)]
for t in threads:
    t.start()
for t in threads:
    t.join()

print(f"Two threads raced past the 1st check; pools created: {DbPool.created}")
print(f"Both threads got the same pool: {pools[0] is pools[1]}")
later = [DbPool.get() for _ in range(1000)]
print(f"1000 later calls, no lock, same pool: {all(p is pools[0] for p in later)}")
print(f"Connections open: {pools[0].connections}")
