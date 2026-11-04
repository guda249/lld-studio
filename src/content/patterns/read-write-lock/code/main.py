import threading
from collections.abc import Callable, Iterator
from contextlib import contextmanager


class ReadWriteLock:
    """Many readers at once, or one writer alone. A waiting writer goes before new readers."""

    def __init__(self) -> None:
        self._cond = threading.Condition()
        self.readers = 0
        self._writing = False
        self._writers_waiting = 0

    @contextmanager
    def read(self) -> Iterator[None]:
        with self._cond:
            while self._writing or self._writers_waiting:  # writers first, so they never starve
                self._cond.wait()
            self.readers += 1
        try:
            yield
        finally:
            with self._cond:
                self.readers -= 1
                if self.readers == 0:
                    self._cond.notify_all()  # wake a waiting writer

    @contextmanager
    def write(self) -> Iterator[None]:
        with self._cond:
            self._writers_waiting += 1
            while self._writing or self.readers:  # wait until the room is empty
                self._cond.wait()
            self._writers_waiting -= 1
            self._writing = True
        try:
            yield
        finally:
            with self._cond:
                self._writing = False
                self._cond.notify_all()


class PriceCatalog:
    def __init__(self, prices: dict[str, int]) -> None:
        self._prices = dict(prices)
        self._lock = ReadWriteLock()
        self.seen_inside: list[int] = []

    def quote(self, cart: list[str], slow_part: Callable[[], object]) -> int:
        with self._lock.read():  # shared: other readers may be inside too
            self.seen_inside.append(self._lock.readers)
            slow_part()  # stands in for slow work done while reading
            return sum(self._prices[sku] for sku in cart)

    def set_price(self, sku: str, price: int) -> int:
        with self._lock.write():  # exclusive: no reader and no other writer inside
            self._prices[sku] = price
            return self._lock.readers


catalog = PriceCatalog({"kurta": 1200, "saree": 3500, "dupatta": 600})
carts = {"Asha": ["kurta", "dupatta"], "Ravi": ["saree"], "Meera": ["kurta"], "Vikram": ["saree", "kurta"]}
all_inside = threading.Barrier(len(carts), timeout=2)  # returns only when all four are inside together
quotes: dict[str, int] = {}
shoppers = [threading.Thread(target=lambda n=n, c=c: quotes.update({n: catalog.quote(c, all_inside.wait)}))
            for n, c in carts.items()]
for t in shoppers:
    t.start()
for t in shoppers:
    t.join()

print("Quotes:", ", ".join(f"{name} ₹{quotes[name]}" for name in sorted(quotes)))
print(f"Peak readers inside at once: {max(catalog.seen_inside)}")
print(f"Sale job wrote kurta = ₹999 with {catalog.set_price('kurta', 999)} readers inside")
print(f"Asha's cart after the sale: ₹{catalog.quote(carts['Asha'], lambda: None)}")
