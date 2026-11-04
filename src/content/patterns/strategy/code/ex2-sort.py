from dataclasses import dataclass
from typing import Callable


@dataclass(frozen=True)
class Product:
    name: str
    price: int
    rating: float
    days_listed: int


SortStrategy = Callable[[list[Product]], list[Product]]

SORTS: dict[str, SortStrategy] = {
    "price_low_high": lambda ps: sorted(ps, key=lambda p: p.price),
    "top_rated": lambda ps: sorted(ps, key=lambda p: p.rating, reverse=True),
    "newest": lambda ps: sorted(ps, key=lambda p: p.days_listed),
}


def search_results(products: list[Product], sort_by: str) -> list[str]:
    return [p.name for p in SORTS[sort_by](products)]


catalog = [
    Product("Kettle", 1499, 4.2, 30),
    Product("Toaster", 999, 4.6, 5),
    Product("Mixer", 2999, 4.4, 12),
]
for option in SORTS:
    print(option, search_results(catalog, option))
