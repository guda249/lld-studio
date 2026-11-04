import threading
import time


class ReadWriteLock:
    def __init__(self, prefer_writers: bool) -> None:
        self._cond = threading.Condition()
        self.prefer_writers = prefer_writers
        self.readers = 0
        self.writing = False
        self.writers_waiting = 0

    def try_read(self) -> bool:
        with self._cond:
            if self.writing or (self.prefer_writers and self.writers_waiting):
                return False  # writer-first: a queued writer closes the door to new readers
            self.readers += 1
            return True

    def release_read(self) -> None:
        with self._cond:
            self.readers -= 1
            self._cond.notify_all()

    def write(self) -> None:
        with self._cond:
            self.writers_waiting += 1
            while self.writing or self.readers:
                self._cond.wait()
            self.writers_waiting -= 1
            self.writing = True

    def release_write(self) -> None:
        with self._cond:
            self.writing = False
            self._cond.notify_all()


class Leaderboard:
    """Thousands of players view it; one score updater changes it."""

    def __init__(self, prefer_writers: bool) -> None:
        self.lock = ReadWriteLock(prefer_writers)
        self.scores = {"Priya": 8800, "Arjun": 9000}

    def update(self, player: str, score: int) -> None:
        self.lock.write()
        try:
            self.scores[player] = score
        finally:
            self.lock.release_write()


def run(prefer_writers: bool, new_viewers: int) -> str:
    board = Leaderboard(prefer_writers)
    for _ in range(2):
        board.lock.try_read()  # two players are already viewing
    updater = threading.Thread(target=board.update, args=("Priya", 9100))
    updater.start()
    while board.lock.writers_waiting == 0:
        time.sleep(0.001)  # wait until the updater is queued
    got_in = sum(board.lock.try_read() for _ in range(new_viewers))
    for _ in range(board.lock.readers):
        board.lock.release_read()  # everyone inside leaves; now the updater can write
    updater.join()
    if got_in:
        return f"writer overtaken by {got_in} readers"
    return f"writer next; {new_viewers} readers wait"


for policy, prefer_writers in [("reader-first", False), ("writer-first", True)]:
    for viewers in [2, 5]:
        print(f"{policy}, {viewers} new viewers: {run(prefer_writers, viewers)}")
print("With a steady stream of viewers, reader-first may never let the updater in.")
