import threading
import time


class ReadWriteLock:
    """Many readers at once, or one writer alone. A queued writer goes before new readers."""

    def __init__(self) -> None:
        self._cond = threading.Condition()
        self.readers = 0
        self.writing = False
        self.writers_waiting = 0

    def acquire_read(self, block: bool = True) -> bool:
        with self._cond:
            while self.writing or self.writers_waiting:
                if not block:
                    return False
                self._cond.wait()
            self.readers += 1
            return True

    def release_read(self) -> None:
        with self._cond:
            self.readers -= 1
            self._cond.notify_all()

    def acquire_write(self, block: bool = True) -> bool:
        with self._cond:
            if not block and (self.writing or self.readers or self.writers_waiting):
                return False
            self.writers_waiting += 1
            while self.writing or self.readers:
                self._cond.wait()
            self.writers_waiting -= 1
            self.writing = True
            return True

    def release_write(self) -> None:
        with self._cond:
            self.writing = False
            self._cond.notify_all()


class RateBoard:
    """Foreign-exchange rates read by every payment, updated by one rate feed."""

    def __init__(self) -> None:
        self.lock = ReadWriteLock()
        self.rates = {"USD": 83.2, "EUR": 90.1}


def holder(lock: ReadWriteLock, kind: str, leave: threading.Event) -> None:
    lock.acquire_read() if kind == "read" else lock.acquire_write()
    leave.wait()
    lock.release_read() if kind == "read" else lock.release_write()


def arrive(lock: ReadWriteLock, who: str) -> str:
    """Tries to get in without waiting and says what happened."""
    got = lock.acquire_read(block=False) if who == "payment" else lock.acquire_write(block=False)
    if got:
        message = f"enters at once ({lock.readers} reading)" if who == "payment" else "enters alone"
        lock.release_read() if who == "payment" else lock.release_write()
        return message
    if lock.writing:
        return "waits for the writer to finish"
    if lock.writers_waiting:
        return "waits: a writer is queued first" if who == "payment" else "waits behind the queued writer"
    return f"waits for {lock.readers} readers to leave"


STATES = {"nobody inside": [], "2 readers inside": ["read", "read"],
          "writer inside": ["write"], "writer queued": ["read", "read", "write"]}

for state, kinds in STATES.items():
    for who in ["payment", "rate feed"]:
        board = RateBoard()
        leave = threading.Event()
        threads = [threading.Thread(target=holder, args=(board.lock, k, leave)) for k in kinds]
        for count, t in enumerate(threads, start=1):
            t.start()
            while board.lock.readers + board.lock.writing + board.lock.writers_waiting < count:
                time.sleep(0.001)  # wait until this holder is inside (or queued)
        print(f"{state:>16} + {who:<9} -> {arrive(board.lock, who)}")
        leave.set()
        for t in threads:
            t.join()
