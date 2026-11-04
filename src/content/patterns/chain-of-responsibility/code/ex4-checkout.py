from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class Order:
    item: str
    qty: int
    pincode: str
    upi_id: str


STOCK = {"kurta": 5, "saree": 0}


class Check(ABC):
    """Handler: on success it forwards the order, on failure it stops the chain."""

    def __init__(self) -> None:
        self._next: "Check | None" = None

    def link(self, other: "Check") -> "Check":
        self._next = other
        return other

    def validate(self, order: Order) -> str:
        error = self.check(order)
        if error is not None:
            return f"Rejected by {type(self).__name__}: {error}"
        if self._next is None:
            return "Order placed"
        return self._next.validate(order)

    @abstractmethod
    def check(self, order: Order) -> str | None: ...


class StockCheck(Check):
    def check(self, order: Order) -> str | None:
        left = STOCK.get(order.item, 0)
        return f"only {left} {order.item} left" if left < order.qty else None


class PincodeCheck(Check):
    def check(self, order: Order) -> str | None:
        ok = len(order.pincode) == 6 and order.pincode.isdigit()
        return None if ok else f"bad pincode {order.pincode}"


class PaymentCheck(Check):
    def check(self, order: Order) -> str | None:
        return None if "@" in order.upi_id else f"bad UPI id {order.upi_id}"


def build_chain(checks: list[Check]) -> Check:
    for a, b in zip(checks, checks[1:]):
        a.link(b)
    return checks[0]


chain = build_chain([StockCheck(), PincodeCheck(), PaymentCheck()])
print(chain.validate(Order("kurta", 2, "560001", "asha@okbank")))
print(chain.validate(Order("saree", 1, "560001", "asha@okbank")))
print(chain.validate(Order("kurta", 1, "5600", "asha@okbank")))
print(chain.validate(Order("kurta", 1, "400050", "ravi-upi")))
