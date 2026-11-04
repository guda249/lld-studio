import threading


class PriceCatalog:
    def __init__(self, prices: dict[str, int]) -> None:
        self._prices = dict(prices)
        self._lock = threading.Lock()  # one lock for readers AND writers
        self._inside = 0
        self.peak_inside = 0

    def quote(self, cart: list[str]) -> int:
        with self._lock:  # a reader shuts out every other reader too
            self._inside += 1
            self.peak_inside = max(self.peak_inside, self._inside)
            total = sum(self._prices[sku] for sku in cart)  # imagine 50 ms of work here
            self._inside -= 1
            return total

    def set_price(self, sku: str, price: int) -> None:
        with self._lock:
            self._prices[sku] = price


catalog = PriceCatalog({"kurta": 1200, "saree": 3500, "dupatta": 600})
carts = {"Asha": ["kurta", "dupatta"], "Ravi": ["saree"], "Meera": ["kurta"], "Vikram": ["saree", "kurta"]}
quotes: dict[str, int] = {}
shoppers = [threading.Thread(target=lambda n=n, c=c: quotes.update({n: catalog.quote(c)})) for n, c in carts.items()]
for t in shoppers:
    t.start()
for t in shoppers:
    t.join()

print("Quotes:", ", ".join(f"{name} ₹{quotes[name]}" for name in sorted(quotes)))
print(f"Peak readers inside at once: {catalog.peak_inside}")
print(f"Reads never change the prices, yet they queued: {len(carts)} × 50 ms = {len(carts) * 50} ms instead of 50 ms")
