from dataclasses import dataclass


@dataclass
class CarMarker:
    lat: float
    lng: float
    icon: bytes        # every marker loads its OWN copy of the same 50 KB image
    color: str


def load_icon() -> bytes:
    return bytes(50_000)


markers = [CarMarker(17.38 + i * 1e-4, 78.48, load_icon(), "yellow") for i in range(200)]
copies = len({id(m.icon) for m in markers})
total_mb = sum(len(m.icon) for m in markers) / 1_000_000
print(f"{len(markers)} markers hold {copies} separate copies of one icon: {total_mb:.1f} MB")
print(f"At 100,000 cars that would be {100_000 * 50_000 / 1e9:.1f} GB")
