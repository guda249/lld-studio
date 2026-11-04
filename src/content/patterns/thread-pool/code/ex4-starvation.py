import threading
from concurrent.futures import ThreadPoolExecutor

# Pool starvation: a task that waits for another task submitted to the SAME pool.
# If every worker is busy waiting, the inner tasks sit in the queue with no worker
# left to run them. Without a timeout the program would hang forever.


def check_stock(item: str) -> bool:
    return True                                 # quick inner task


class OrderService:
    def __init__(self, workers: int, separate_stock_pool: bool) -> None:
        self.orders = ThreadPoolExecutor(max_workers=workers)
        self.stock = ThreadPoolExecutor(max_workers=2) if separate_stock_pool else self.orders
        self.rush = threading.Barrier(2)        # demo only: both orders start and end together

    def confirm(self, item: str) -> str:        # runs on an order worker
        self.rush.wait()
        check = self.stock.submit(check_stock, item)
        try:
            result = "confirmed" if check.result(timeout=0.05) else "out of stock"
        except TimeoutError:
            result = "timed out"                # no free worker ever ran check_stock
        self.rush.wait()                        # keep both workers busy until both orders are done
        return result

    def run(self, items: list[str]) -> str:
        results = [f.result() for f in [self.orders.submit(self.confirm, i) for i in items]]
        self.orders.shutdown()
        self.stock.shutdown()
        return f"{results.count('confirmed')} confirmed, {results.count('timed out')} timed out"


if __name__ == "__main__":
    for separate in (False, True):
        for workers in (2, 3):
            design = "separate stock pool" if separate else "same pool"
            print(f"{design}, {workers} workers: {OrderService(workers, separate).run(['kurta', 'saree'])}")
