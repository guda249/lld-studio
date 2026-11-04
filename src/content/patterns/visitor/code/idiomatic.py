from dataclasses import dataclass
from functools import singledispatch


@dataclass
class Item:
    price: float


@dataclass
class Book(Item):
    pass


@dataclass
class Electronics(Item):
    warranty_years: int


@dataclass
class Grocery(Item):
    weight_kg: float


@singledispatch
def tax(item: Item) -> float:                 # fallback for unknown types
    raise NotImplementedError(type(item).__name__)


@tax.register
def _(item: Book) -> float:
    return 0.0


@tax.register
def _(item: Electronics) -> float:
    return item.price * 0.18


@tax.register
def _(item: Grocery) -> float:
    return item.price * 0.05


cart: list[Item] = [Book(499), Electronics(15_000, 1), Grocery(300, 2.5)]
print("tax:", sum(tax(item) for item in cart))   # 2715.0
