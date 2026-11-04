from dataclasses import dataclass


@dataclass(frozen=True)
class CartMemento:                        # memento
    items: tuple[tuple[str, int], ...]
    discount: int


class Cart:                               # originator
    def __init__(self) -> None:
        self._items: dict[str, int] = {}
        self._discount = 0

    def add(self, sku: str, price: int) -> None:
        self._items[sku] = price

    def apply_coupons(self, codes: list[str]) -> None:
        for code in codes:
            if code == "FLAT100":
                self._discount += 100
            elif code == "FREESHIP":
                self._items["shipping"] = 0
            else:
                raise ValueError(f"coupon {code} is not valid")

    def total(self) -> int:
        return sum(self._items.values()) - self._discount

    def save(self) -> CartMemento:
        return CartMemento(tuple(self._items.items()), self._discount)

    def restore(self, m: CartMemento) -> None:
        self._items = dict(m.items)
        self._discount = m.discount


def apply_all_or_nothing(cart: Cart, codes: list[str]) -> None:   # caretaker
    checkpoint = cart.save()
    try:
        cart.apply_coupons(codes)
        print(f"Applied {', '.join(codes)}: total ₹{cart.total()}")
    except ValueError as err:
        cart.restore(checkpoint)
        print(f"Rolled back ({err}): total ₹{cart.total()}")


cart = Cart()
cart.add("kurta", 1499)
cart.add("shipping", 79)
print(f"Start: total ₹{cart.total()}")
apply_all_or_nothing(cart, ["FLAT100", "FREESHIP", "DIWALI90"])
apply_all_or_nothing(cart, ["FLAT100", "FREESHIP"])
