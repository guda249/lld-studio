import copy
from dataclasses import dataclass, field


@dataclass
class LineItem:
    product: str
    qty: int


@dataclass
class Order:
    order_id: str
    items: list[LineItem] = field(default_factory=list)

    def shallow_duplicate(self) -> "Order":
        return copy.copy(self)  # new Order, but the SAME LineItem objects inside

    def duplicate(self) -> "Order":
        return copy.deepcopy(self)  # new Order with its own items


def describe(order: Order) -> str:
    return f"{order.order_id}: " + ", ".join(f"{i.qty} x {i.product}" for i in order.items)


past = Order("ORD-1", [LineItem("atta 5kg", 1), LineItem("toor dal", 2)])

bad = past.shallow_duplicate()
bad.order_id = "ORD-2"
bad.items[0].qty = 3  # the customer wants more atta this time
print("Shallow copy:")
print(f"  {describe(bad)}")
print(f"  {describe(past)}   <- the old order changed too")

past.items[0].qty = 1  # put the history back
good = past.duplicate()
good.order_id = "ORD-3"
good.items[0].qty = 3
print("Deep copy:")
print(f"  {describe(good)}")
print(f"  {describe(past)}   <- history is safe")
