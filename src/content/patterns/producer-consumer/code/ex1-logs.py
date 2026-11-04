import threading
from queue import Queue

STOP = None


class LogWriter(threading.Thread):              # consumer: the only thread that touches the disk
    def __init__(self, lines: Queue[str | None], batch_size: int) -> None:
        super().__init__()
        self._lines, self._batch_size = lines, batch_size
        self.disk_writes = 0
        self.written = 0

    def run(self) -> None:
        batch: list[str] = []
        while (line := self._lines.get()) is not STOP:
            batch.append(line)
            if len(batch) == self._batch_size:
                self._flush(batch)
        self._flush(batch)                      # whatever is left at shutdown

    def _flush(self, batch: list[str]) -> None:
        if batch:
            self.disk_writes += 1
            self.written += len(batch)
            batch.clear()


def request_thread(lines: Queue[str | None], name: str) -> None:     # producer
    for i in range(4):
        lines.put(f"{name}: request {i} served")


def run(threads: int, batch_size: int) -> str:
    lines: Queue[str | None] = Queue(maxsize=100)
    writer = LogWriter(lines, batch_size)
    writer.start()
    producers = [threading.Thread(target=request_thread, args=(lines, f"web-{k}")) for k in range(threads)]
    for p in producers:
        p.start()
    for p in producers:
        p.join()
    lines.put(STOP)                             # only after every producer has finished
    writer.join()
    return f"{writer.written} lines in {writer.disk_writes} disk writes"


if __name__ == "__main__":
    for threads in (2, 3):
        for batch_size in (1, 5, 10):
            print(f"{threads} request threads, batch {batch_size}: {run(threads, batch_size)}")
