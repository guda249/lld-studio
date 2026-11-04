from dataclasses import dataclass

SIZE_PRICE = {"small": 199, "medium": 349, "large": 499}
TOPPING_PRICE = 40


@dataclass(frozen=True)
class Pizza:
    size: str
    crust: str
    toppings: tuple[str, ...]
    extra_cheese: bool

    def price(self) -> int:
        return SIZE_PRICE[self.size] + TOPPING_PRICE * len(self.toppings) + (60 if self.extra_cheese else 0)


class PizzaBuilder:
    def __init__(self, size: str) -> None:
        self._size = size
        self._crust = "classic"
        self._toppings: list[str] = []
        self._extra_cheese = False

    def crust(self, crust: str) -> "PizzaBuilder":
        self._crust = crust
        return self

    def topping(self, name: str) -> "PizzaBuilder":
        self._toppings.append(name)
        return self

    def extra_cheese(self) -> "PizzaBuilder":
        self._extra_cheese = True
        return self

    def build(self) -> Pizza:
        if self._size not in SIZE_PRICE:
            raise ValueError(f"unknown size {self._size}")
        if len(self._toppings) > 5:
            raise ValueError("at most 5 toppings")
        return Pizza(self._size, self._crust, tuple(self._toppings), self._extra_cheese)


# the director: named recipes that run a fixed sequence of builder steps
def margherita(size: str) -> Pizza:
    return PizzaBuilder(size).topping("basil").extra_cheese().build()


def farmhouse(size: str) -> Pizza:
    return PizzaBuilder(size).crust("thin").topping("onion").topping("capsicum").topping("mushroom").build()


custom = PizzaBuilder("small").crust("cheese burst").topping("paneer").topping("jalapeno").build()
for name, pizza in (("Margherita", margherita("medium")), ("Farmhouse", farmhouse("large")), ("Custom", custom)):
    print(f"{name}: {pizza.size}, {pizza.crust} crust, {', '.join(pizza.toppings)} -> ₹{pizza.price()}")
