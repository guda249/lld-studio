from dataclasses import dataclass


@dataclass(frozen=True)
class MarkerStyle:
    """Flyweight: intrinsic, shared and immutable (imagine a 50 KB bitmap here)."""
    icon: str
    color: str


class MarkerStyleFactory:
    _styles: dict[tuple[str, str], MarkerStyle] = {}

    @classmethod
    def get(cls, icon: str, color: str) -> MarkerStyle:
        key = (icon, color)
        if key not in cls._styles:
            cls._styles[key] = MarkerStyle(icon, color)
        return cls._styles[key]

    @classmethod
    def count(cls) -> int:
        return len(cls._styles)


@dataclass(slots=True)
class Marker:
    """Context: extrinsic state, unique to each car, plus a shared style."""
    lat: float
    lng: float
    style: MarkerStyle

    def draw(self) -> str:
        return f"{self.style.icon} ({self.style.color}) at {self.lat:.4f},{self.lng:.4f}"


markers = [
    Marker(17.38 + i * 1e-4, 78.48, MarkerStyleFactory.get("car.png", "yellow"))
    for i in range(100_000)
]
markers.append(Marker(17.44, 78.35, MarkerStyleFactory.get("bike.png", "green")))
print(len(markers), "markers share", MarkerStyleFactory.count(), "styles")
print(markers[0].draw())
print(markers[-1].draw())
print("same style object:", markers[0].style is markers[99_999].style)
