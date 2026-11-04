from dataclasses import dataclass


def load_logo(carrier: str) -> bytes:
    return carrier.encode() * 2_000  # stands in for a heavy label logo (about 20 KB)


@dataclass(frozen=True)
class CarrierStyle:  # flyweight: shared, never changes
    carrier: str
    service: str
    logo: bytes


class CarrierCatalog:  # factory: one CarrierStyle per (carrier, service)
    def __init__(self) -> None:
        self._styles: dict[tuple[str, str], CarrierStyle] = {}

    def style(self, carrier: str, service: str) -> CarrierStyle:
        key = (carrier, service)
        if key not in self._styles:
            self._styles[key] = CarrierStyle(carrier, service, load_logo(carrier))
        return self._styles[key]


class Parcel:  # context: only what is unique to this parcel
    def __init__(self, tracking: str, weight_kg: float, style: CarrierStyle) -> None:
        self.tracking = tracking
        self.weight_kg = weight_kg
        self.style = style

    def label(self) -> str:
        s = self.style
        return f"{self.tracking} {self.weight_kg:.1f} kg via {s.carrier} {s.service} (logo {len(s.logo)} B)"


if __name__ == "__main__":
    catalog = CarrierCatalog()
    routes = [("SwiftPost", "Express"), ("GreenFreight", "Economy"), ("SwiftPost", "Express")]
    parcels = [
        Parcel(f"TRK{n:04d}", 1.0 + n % 7, catalog.style(carrier, service))
        for n, (carrier, service) in enumerate(routes * 2)
    ]
    for parcel in parcels[:3]:
        print(parcel.label())
    print(f"{len(parcels)} parcels, total weight {sum(p.weight_kg for p in parcels):.1f} kg")
