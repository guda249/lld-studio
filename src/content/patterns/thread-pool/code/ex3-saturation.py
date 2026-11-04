import threading
from concurrent.futures import Future, ThreadPoolExecutor
from typing import Any, Callable

# ThreadPoolExecutor's waiting queue has no limit. At the dinner peak that means
# thousands of pushes pile up in memory. A bounded pool takes at most
# workers + queue_size tasks and rejects the rest at once, so the caller can retry later.


class BoundedPool:
    def __init__(self, workers: int, queue_size: int) -> None:
        self._pool = ThreadPoolExecutor(max_workers=workers)
        self._slots = threading.Semaphore(workers + queue_size)   # running + waiting

    def try_submit(self, fn: Callable[..., str], *args: Any) -> Future[str] | None:
        if not self._slots.acquire(blocking=False):
            return None                         # full: reject now instead of piling up
        future = self._pool.submit(fn, *args)
        future.add_done_callback(lambda _: self._slots.release())
        return future

    def shutdown(self) -> None:
        self._pool.shutdown(wait=True)


def dinner_peak(workers: int, queue_size: int) -> str:
    gate = threading.Event()                    # holds every push until all 10 are offered

    def push(order: int) -> str:
        gate.wait()
        return f"pushed #{order}"

    pool = BoundedPool(workers, queue_size)
    accepted = [f for n in range(1, 11) if (f := pool.try_submit(push, n)) is not None]
    gate.set()                                  # the slow push service answers
    pool.shutdown()
    sent = sum(1 for f in accepted if f.result().startswith("pushed"))
    return f"{sent} sent, {10 - len(accepted)} rejected"


if __name__ == "__main__":
    for workers in (2, 4):
        for queue_size in (2, 4):
            print(f"{workers} workers, queue {queue_size}: {dinner_peak(workers, queue_size)}")
