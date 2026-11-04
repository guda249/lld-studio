class Dish:
    def __init__(self, name: str, price: float) -> None:
        self.name = name
        self.price = price


class Combo:
    def __init__(self, name: str, discount: float) -> None:
        self.name = name
        self.discount = discount
        self.items: list[object] = []


# every function asks "dish or combo?"; adding a Drink with a deposit means editing them all
def price_of(entry: object) -> float:
    if isinstance(entry, Dish):
        return entry.price
    if isinstance(entry, Combo):
        return round(sum(price_of(i) for i in entry.items) * (1 - entry.discount), 2)
    raise TypeError("unknown menu entry")


def render(entry: object, depth: int = 0) -> str:
    pad = "  " * depth
    if isinstance(entry, Dish):
        return f"{pad}{entry.name}: {entry.price:.2f}"
    if isinstance(entry, Combo):
        lines = [f"{pad}{entry.name} (-{entry.discount:.0%}): {price_of(entry):.2f}"]
        return "\n".join(lines + [render(i, depth + 1) for i in entry.items])
    raise TypeError("unknown menu entry")


if __name__ == "__main__":
    kids = Combo("Kids box", 0.10)
    kids.items += [Dish("Mini burger", 4.50), Dish("Apple juice", 2.00)]
    family = Combo("Family deal", 0.20)
    family.items += [Dish("Large pizza", 14.00), kids, kids]
    print(render(family))
