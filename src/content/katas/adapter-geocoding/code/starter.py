class GeoCodeApi:
    """Third-party library: we can't change it. Coordinates come back in millionths of a degree."""

    _places = {"12 Baker St": (51523767, -158553), "1 Main Rd": (51507351, -127758)}

    def geocode(self, query: str) -> dict[str, int]:
        lat, lng = self._places[query]
        return {"lat_e6": lat, "lng_e6": lng}


class StoreFinder:
    def __init__(self, api: GeoCodeApi) -> None:
        self.api = api

    def nearest_to(self, address: str) -> str:
        raw = self.api.geocode(address)  # knows the vendor's units
        lat, lng = raw["lat_e6"] / 1_000_000, raw["lng_e6"] / 1_000_000
        store = "North store" if lat > 51.515 else "South store"
        return f"{address} ({lat:.4f}, {lng:.4f}) -> {store}"


class DeliveryZone:
    def __init__(self, api: GeoCodeApi) -> None:
        self.api = api

    def is_covered(self, address: str) -> str:
        raw = self.api.geocode(address)  # and again, converted by hand
        lng = raw["lng_e6"] / 1_000_000
        return f"{address} delivery: {'yes' if lng > -0.15 else 'no'}"


if __name__ == "__main__":
    api = GeoCodeApi()
    finder = StoreFinder(api)
    zone = DeliveryZone(api)
    addresses = ["12 Baker St", "1 Main Rd"]
    for address in addresses:
        print(finder.nearest_to(address))
    for address in addresses:
        print(zone.is_covered(address))
