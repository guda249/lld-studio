from abc import ABC, abstractmethod
from dataclasses import dataclass


class ItemVisitor(ABC):
    @abstractmethod
    def visit_book(self, item: "Book") -> float: ...

    @abstractmethod
    def visit_electronics(self, item: "Electronics") -> float: ...

    @abstractmethod
    def visit_grocery(self, item: "Grocery") -> float: ...


class Item(ABC):
    @abstractmethod
    def accept(self, visitor: ItemVisitor) -> float: ...


@dataclass
class Book(Item):
    price: float

    def accept(self, visitor: ItemVisitor) -> float:
        return visitor.visit_book(self)


@dataclass
class Electronics(Item):
    price: float
    warranty_years: int

    def accept(self, visitor: ItemVisitor) -> float:
        return visitor.visit_electronics(self)


@dataclass
class Grocery(Item):
    price: float
    weight_kg: float

    def accept(self, visitor: ItemVisitor) -> float:
        return visitor.visit_grocery(self)


class TaxVisitor(ItemVisitor):               # sample rates for illustration
    def visit_book(self, item: Book) -> float: return 0.0
    def visit_electronics(self, item: Electronics) -> float: return item.price * 0.18
    def visit_grocery(self, item: Grocery) -> float: return item.price * 0.05


class ShippingVisitor(ItemVisitor):
    def visit_book(self, item: Book) -> float: return 40.0
    def visit_electronics(self, item: Electronics) -> float: return 0.0 if item.price >= 10_000 else 100.0
    def visit_grocery(self, item: Grocery) -> float: return 20.0 * item.weight_kg


cart: list[Item] = [Book(499), Electronics(15_000, 1), Grocery(300, 2.5)]
print("tax:", sum(item.accept(TaxVisitor()) for item in cart))            # 2715.0
print("shipping:", sum(item.accept(ShippingVisitor()) for item in cart))  # 90.0
