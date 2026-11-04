from abc import ABC, abstractmethod


class Geocoder(ABC):
    @abstractmethod
    def lookup(self, address: str) -> tuple[float, float]: ...


class MapApiGeocoder(Geocoder):
    """Turns an address into map coordinates. Every call is a slow, paid-per-request web call."""

    def __init__(self) -> None:
        self.calls = 0

    def lookup(self, address: str) -> tuple[float, float]:
        self.calls += 1
        print(f"  (map API call for {address})")
        return (len(address) * 0.5, len(address) * 0.25)


class CachingGeocoder(Geocoder):
    """Caching proxy: same interface, answers repeat questions itself, asks the real API only once per address."""

    def __init__(self, real: Geocoder) -> None:
        self._real = real
        self._cache: dict[str, tuple[float, float]] = {}

    def lookup(self, address: str) -> tuple[float, float]:
        if address not in self._cache:
            self._cache[address] = self._real.lookup(address)
        return self._cache[address]


def plan_route(geo: Geocoder, start: str, end: str) -> str:
    return f"route {geo.lookup(start)} -> {geo.lookup(end)}"


def drop_pin(geo: Geocoder, address: str) -> str:
    return f"pin at {geo.lookup(address)}"


if __name__ == "__main__":
    api = MapApiGeocoder()
    geo: Geocoder = CachingGeocoder(api)
    print(plan_route(geo, "12 Oak St", "7 Elm Rd"))
    print(plan_route(geo, "12 Oak St", "3 Pine Ave"))
    print(drop_pin(geo, "12 Oak St"))
    print(drop_pin(geo, "12 Oak St"))
    print(f"API calls: {api.calls}")
