from dataclasses import dataclass
from functools import cache


@dataclass(frozen=True)
class MarkerStyle:
    icon: str
    color: str


@cache                      # the cache IS the flyweight factory
def style(icon: str, color: str) -> MarkerStyle:
    return MarkerStyle(icon, color)


@dataclass(slots=True)      # slots also cut the memory used by each marker
class Marker:
    lat: float
    lng: float
    style: MarkerStyle


markers = [Marker(12.97 + i * 1e-4, 77.59, style("auto.png", "green")) for i in range(50_000)]
print(len(markers), "markers,", style.cache_info().currsize, "style object")
print("shared:", markers[0].style is markers[-1].style)
