from abc import ABC, abstractmethod


class CartItem(ABC):  # component
    def __init__(self, name: str) -> None:
        self.name = name

    @abstractmethod
    def price(self) -> int: ...

    @abstractmethod
    def lines(self, depth: int = 0) -> list[str]: ...


class Item(CartItem):  # leaf
    def __init__(self, name: str, price_inr: int) -> None:
        super().__init__(name)
        self._price = price_inr

    def price(self) -> int:
        return self._price

    def lines(self, depth: int = 0) -> list[str]:
        return ["  " * depth + f"{self.name}: ₹{self._price:,}"]


class Bundle(CartItem):  # composite that also adds its own rule: a discount
    def __init__(self, name: str, discount_pct: int = 0) -> None:
        super().__init__(name)
        self._discount_pct = discount_pct
        self._children: list[CartItem] = []

    def add(self, *items: CartItem) -> "Bundle":
        self._children.extend(items)
        return self

    def price(self) -> int:
        total = sum(child.price() for child in self._children)
        return total * (100 - self._discount_pct) // 100

    def lines(self, depth: int = 0) -> list[str]:
        head = "  " * depth + f"{self.name} ({self._discount_pct}% off): ₹{self.price():,}"
        return [head] + [line for child in self._children for line in child.lines(depth + 1)]


diwali_box = Bundle("Diwali gift box", 10).add(
    Item("Kaju katli 500 g", 650),
    Item("Diya set", 300),
    Bundle("Dry fruit pack", 5).add(Item("Almonds", 450), Item("Cashews", 550)),
)
cart: list[CartItem] = [Item("Phone cover", 299), diwali_box]
for entry in cart:
    print("\n".join(entry.lines()))
print(f"Cart total: ₹{sum(entry.price() for entry in cart):,}")
