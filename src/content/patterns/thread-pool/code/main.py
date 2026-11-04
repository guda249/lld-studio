import threading
from concurrent.futures import Future
from queue import Queue
from typing import Any, Callable

Task = tuple[Callable[..., Any], tuple[Any, ...], Future[Any]] | None   # None = stop


class ThreadPool:
    def __init__(self, size: int) -> None:
        self.size = size
        self._tasks: Queue[Task] = Queue()      # submitted tasks wait here
        self._workers = [threading.Thread(target=self._work) for _ in range(size)]
        for w in self._workers:
            w.start()                           # threads are created once, here

    def submit(self, fn: Callable[..., Any], *args: Any) -> Future[Any]:
        future: Future[Any] = Future()
        self._tasks.put((fn, args, future))     # the task waits for a free worker
        return future                           # the caller gets a handle at once

    def _work(self) -> None:
        while (task := self._tasks.get()) is not None:
            fn, args, future = task
            try:
                future.set_result(fn(*args))    # the same thread runs task after task
            except Exception as err:
                future.set_exception(err)       # errors travel back to the caller too

    def shutdown(self) -> None:
        for _ in self._workers:
            self._tasks.put(None)               # one stop signal per worker
        for w in self._workers:
            w.join()


def make_invoice(order_id: int) -> str:
    if order_id == 7:
        raise ValueError("order 7 has no address")
    return f"invoice-{order_id}.pdf"


pool = ThreadPool(3)
futures = [pool.submit(make_invoice, oid) for oid in range(1, 11)]
pool.shutdown()

ok = [f.result() for f in futures if f.exception() is None]
print(f"10 orders -> threads created: {pool.size}")
print(f"First three: {ok[:3]}")
print(f"Order 7 failed: {futures[6].exception()}")
print(f"Invoices ready: {len(ok)}")
