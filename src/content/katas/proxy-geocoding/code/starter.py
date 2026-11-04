class MapApiGeocoder:
    """Turns an address into map coordinates. Every call is a slow, paid-per-request web call."""

    def __init__(self) -> None:
        self.calls = 0

    def lookup(self, address: str) -> tuple[float, float]:
        self.calls += 1
        print(f"  (map API call for {address})")
        return (len(address) * 0.5, len(address) * 0.25)


# One shared cache, but every caller must remember to check and fill it by hand.
_cache: dict[str, tuple[float, float]] = {}


def plan_route(geo: MapApiGeocoder, start: str, end: str) -> str:
    if start not in _cache:
        _cache[start] = geo.lookup(start)
    if end not in _cache:
        _cache[end] = geo.lookup(end)
    return f"route {_cache[start]} -> {_cache[end]}"


def drop_pin(geo: MapApiGeocoder, address: str) -> str:
    if address not in _cache:
        _cache[address] = geo.lookup(address)
    return f"pin at {_cache[address]}"


if __name__ == "__main__":
    geo = MapApiGeocoder()
    print(plan_route(geo, "12 Oak St", "7 Elm Rd"))
    print(plan_route(geo, "12 Oak St", "3 Pine Ave"))
    print(drop_pin(geo, "12 Oak St"))
    print(drop_pin(geo, "12 Oak St"))
    print(f"API calls: {geo.calls}")
