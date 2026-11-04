import math
import time
from concurrent.futures import ThreadPoolExecutor

CALL_MS = 20                                    # each airline API call waits ~20 ms (I/O)

AIRLINES: dict[str, int] = {                    # made-up airlines and fares (rupees)
    "SkyJet": 4350, "BlueWing": 5120, "Kite Air": 4180,
    "Coastal": 4420, "Deccan Air": 5600, "Monsoon": 4260,
}


def fetch_fare(airline: str) -> tuple[int, str]:
    time.sleep(CALL_MS / 1000)                  # waiting on the network: the GIL is released
    return AIRLINES[airline], airline


class FareSearch:
    def __init__(self, workers: int) -> None:
        self.workers = workers

    def cheapest(self) -> str:
        with ThreadPoolExecutor(max_workers=self.workers) as pool:
            fares = list(pool.map(fetch_fare, AIRLINES))   # 6 tasks share the workers
        price, airline = min(fares)
        rounds = math.ceil(len(AIRLINES) / self.workers)    # calls each worker makes in turn
        return f"cheapest {airline} ₹{price:,} in ~{rounds * CALL_MS} ms"


if __name__ == "__main__":
    for workers in (1, 2, 3, 6):
        print(f"{workers} worker(s): {FareSearch(workers).cheapest()}")
