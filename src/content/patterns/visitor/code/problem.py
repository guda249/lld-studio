from dataclasses import dataclass


# Every new operation (tax, shipping, points, CSV export...) is added to EVERY item class.
@dataclass
class Book:
    price: float
    def tax(self) -> float: return 0.0
    def shipping(self) -> float: return 40.0
    def loyalty_points(self) -> int: return int(self.price // 100)


@dataclass
class Electronics:
    price: float
    def tax(self) -> float: return self.price * 0.18
    def shipping(self) -> float: return 0.0 if self.price >= 10_000 else 100.0
    def loyalty_points(self) -> int: return int(self.price // 200)


@dataclass
class Grocery:
    price: float
    weight_kg: float
    def tax(self) -> float: return self.price * 0.05
    def shipping(self) -> float: return 20.0 * self.weight_kg
    def loyalty_points(self) -> int: return 0


cart = [Book(499), Electronics(15_000), Grocery(300, 2.5)]
print("tax:", sum(i.tax() for i in cart), "| shipping:", sum(i.shipping() for i in cart),
      "| points:", sum(i.loyalty_points() for i in cart))
