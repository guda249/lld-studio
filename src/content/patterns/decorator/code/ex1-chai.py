from abc import ABC, abstractmethod


class Beverage(ABC):
    @abstractmethod
    def description(self) -> str: ...

    @abstractmethod
    def cost(self) -> int: ...


class MasalaChai(Beverage):
    def description(self) -> str:
        return "Masala chai"

    def cost(self) -> int:
        return 40


class FilterCoffee(Beverage):
    def description(self) -> str:
        return "Filter coffee"

    def cost(self) -> int:
        return 50


class AddOn(Beverage, ABC):
    """Base decorator: wraps any beverage, including another add-on."""

    def __init__(self, drink: Beverage) -> None:
        self._drink = drink


class Ginger(AddOn):
    def description(self) -> str:
        return self._drink.description() + " + ginger"

    def cost(self) -> int:
        return self._drink.cost() + 10


class Jaggery(AddOn):
    def description(self) -> str:
        return self._drink.description() + " + jaggery"

    def cost(self) -> int:
        return self._drink.cost() + 15


class OatMilk(AddOn):
    def description(self) -> str:
        return self._drink.description() + " + oat milk"

    def cost(self) -> int:
        return self._drink.cost() + 35


orders: list[Beverage] = [
    MasalaChai(),
    Ginger(Jaggery(MasalaChai())),
    OatMilk(OatMilk(FilterCoffee())),
]
for order in orders:
    print(f"{order.description():<42} ₹{order.cost()}")
