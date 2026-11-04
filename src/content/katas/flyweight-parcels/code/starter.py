def load_logo(carrier: str) -> bytes:
    return carrier.encode() * 2_000  # stands in for a heavy label logo (about 20 KB)


class Parcel:
    # every parcel carries its own copy of the carrier's logo and service text
    def __init__(self, tracking: str, weight_kg: float, carrier: str, service: str, logo: bytes) -> None:
        self.tracking = tracking
        self.weight_kg = weight_kg
        self.carrier = carrier
        self.service = service
        self.logo = logo

    def label(self) -> str:
        return f"{self.tracking} {self.weight_kg:.1f} kg via {self.carrier} {self.service} (logo {len(self.logo)} B)"


if __name__ == "__main__":
    # a busy depot handles 50,000 parcels a day, but only a handful of carrier styles
    routes = [("SwiftPost", "Express"), ("GreenFreight", "Economy"), ("SwiftPost", "Express")]
    parcels = [
        Parcel(f"TRK{n:04d}", 1.0 + n % 7, carrier, service, load_logo(carrier))
        for n, (carrier, service) in enumerate(routes * 2)
    ]
    for parcel in parcels[:3]:
        print(parcel.label())
    print(f"{len(parcels)} parcels, total weight {sum(p.weight_kg for p in parcels):.1f} kg")
