from dataclasses import dataclass
from functools import cmp_to_key


@dataclass
class Listing:
    name: str
    price: int
    in_stock: bool
    rating: float


# Old ranking code from the 2015 codebase: a comparator that returns -1, 0 or 1.
def legacy_rank_cmp(a: Listing, b: Listing) -> int:
    if a.in_stock != b.in_stock:
        return -1 if a.in_stock else 1  # in-stock items first
    if a.rating != b.rating:
        return -1 if a.rating > b.rating else 1  # then higher rating
    return (a.price > b.price) - (a.price < b.price)  # then cheaper first


# sorted() wants a key whose objects support "<", not a comparator.
class RankKey:  # hand-written adapter: comparator -> "<"
    def __init__(self, product: Listing) -> None:
        self.product = product

    def __lt__(self, other: "RankKey") -> bool:
        return legacy_rank_cmp(self.product, other.product) < 0


catalogue = [
    Listing("Sneakers", 2499, False, 4.8),
    Listing("Saree", 1899, True, 4.5),
    Listing("Watch", 999, True, 4.1),
    Listing("Kurta", 1299, True, 4.5),
]

ranked = sorted(catalogue, key=RankKey)
print("Ranked:", ", ".join(f"{p.name} ₹{p.price}" for p in ranked))

# The standard library ships the same adapter ready-made.
same = sorted(catalogue, key=cmp_to_key(legacy_rank_cmp))
print(f"cmp_to_key gives the same order: {same == ranked}")
