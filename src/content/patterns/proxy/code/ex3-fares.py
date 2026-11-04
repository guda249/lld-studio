from abc import ABC, abstractmethod


class FareService(ABC):
    @abstractmethod
    def fare(self, route: str, now: int) -> int: ...


class AirlineFareApi(FareService):
    """The real API: slow, and the airline bills us per call."""

    def __init__(self) -> None:
        self.calls = 0

    def fare(self, route: str, now: int) -> int:
        self.calls += 1
        base = {"BLR-DEL": 5400, "BOM-GOI": 2900}[route]
        return base + 100 * (now // 300)        # prices drift every 5 minutes


class CachedFareService(FareService):
    """Caching proxy: answers repeat questions for `ttl` seconds without calling the API."""

    def __init__(self, real: FareService, ttl: int) -> None:
        self._real = real
        self._ttl = ttl
        self._cache: dict[str, tuple[int, int]] = {}     # route -> (fare, fetched_at)

    def fare(self, route: str, now: int) -> int:
        hit = self._cache.get(route)
        if hit is not None and now - hit[1] < self._ttl:
            return hit[0]
        value = self._real.fare(route, now)
        self._cache[route] = (value, now)
        return value


api = AirlineFareApi()
fares: FareService = CachedFareService(api, ttl=120)
searches = [(0, "BLR-DEL"), (30, "BLR-DEL"), (45, "BOM-GOI"), (90, "BLR-DEL"), (400, "BLR-DEL")]
for now, route in searches:                         # (seconds on a fake clock, route)
    print(f"t={now:>3}s {route} ₹{fares.fare(route, now):,}")
print(f"{len(searches)} searches, {api.calls} paid API calls")
