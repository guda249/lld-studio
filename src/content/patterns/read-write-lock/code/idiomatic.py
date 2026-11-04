import threading
from types import MappingProxyType
from typing import Mapping


class PriceCatalog:
    """Copy-on-write: readers take no lock at all; a writer builds a new snapshot and swaps it in."""

    def __init__(self, prices: dict[str, int]) -> None:
        self._snapshot: Mapping[str, int] = MappingProxyType(dict(prices))
        self._write_lock = threading.Lock()  # only writers queue, and only behind each other

    @property
    def current(self) -> Mapping[str, int]:
        return self._snapshot

    def quote(self, cart: list[str]) -> int:
        prices = self._snapshot  # one read of one reference: always a whole, consistent snapshot
        return sum(prices[sku] for sku in cart)

    def set_prices(self, changes: dict[str, int]) -> None:
        with self._write_lock:
            fresh = dict(self._snapshot)
            fresh.update(changes)
            self._snapshot = MappingProxyType(fresh)  # swap in one step; old readers keep the old one


catalog = PriceCatalog({"kurta": 1200, "saree": 3500, "dupatta": 600})
before = catalog.current
catalog.set_prices({"kurta": 999, "dupatta": 499})

print(f"Asha's cart now: ₹{catalog.quote(['kurta', 'dupatta'])}")
print(f"A reader still holding the old snapshot sees: ₹{before['kurta'] + before['dupatta']}")
print(f"Old snapshot changed? {before['kurta'] != 1200}")
