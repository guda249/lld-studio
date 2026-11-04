from abc import ABC, abstractmethod


class MenuEntry(ABC):  # component: what every entry can answer
    def __init__(self, name: str) -> None:
        self.name = name

    @abstractmethod
    def price(self) -> float: ...

    @abstractmethod
    def render(self, depth: int = 0) -> str: ...


class Dish(MenuEntry):  # leaf
    def __init__(self, name: str, price: float) -> None:
        super().__init__(name)
        self._price = price

    def price(self) -> float:
        return self._price

    def render(self, depth: int = 0) -> str:
        return f"{'  ' * depth}{self.name}: {self._price:.2f}"


class Combo(MenuEntry):  # composite: asks its entries and combines the answers
    def __init__(self, name: str, discount: float) -> None:
        super().__init__(name)
        self.discount = discount
        self._entries: list[MenuEntry] = []

    def add(self, *entries: MenuEntry) -> "Combo":
        self._entries.extend(entries)
        return self

    def price(self) -> float:
        return round(sum(e.price() for e in self._entries) * (1 - self.discount), 2)

    def render(self, depth: int = 0) -> str:
        lines = [f"{'  ' * depth}{self.name} (-{self.discount:.0%}): {self.price():.2f}"]
        return "\n".join(lines + [e.render(depth + 1) for e in self._entries])


if __name__ == "__main__":
    kids = Combo("Kids box", 0.10).add(Dish("Mini burger", 4.50), Dish("Apple juice", 2.00))
    family = Combo("Family deal", 0.20).add(Dish("Large pizza", 14.00), kids, kids)
    print(family.render())
