# After: small value types say what each value is, and check themselves.
from dataclasses import dataclass
from decimal import Decimal
from enum import Enum


class Currency(Enum):
    INR = "INR"
    USD = "USD"


@dataclass(frozen=True)
class Money:
    amount: Decimal  # exact: no 0.30000000000000004
    currency: Currency

    def __add__(self, other: "Money") -> "Money":
        if other.currency != self.currency:
            raise ValueError(f"can't add {other.currency.value} to {self.currency.value}")
        return Money(self.amount + other.amount, self.currency)


@dataclass(frozen=True)
class OrderId:
    value: str


@dataclass(frozen=True)
class CustomerId:
    value: str


class OrderStatus(Enum):
    PLACED = "placed"
    DELIVERED = "delivered"


def refund(order: OrderId, customer: CustomerId, amount: Money, status: OrderStatus) -> str:
    if status is not OrderStatus.DELIVERED:
        return f"no refund for {order.value}: status is {status.value}"
    return f"refund {amount.amount} {amount.currency.value} to {customer.value} for order {order.value}"


if __name__ == "__main__":
    total = Money(Decimal("0.10"), Currency.INR) + Money(Decimal("0.20"), Currency.INR)
    print("total:", total.amount)  # 0.30
    print(refund(OrderId("O-1001"), CustomerId("C-77"), total, OrderStatus.DELIVERED))
    try:
        total + Money(Decimal("1"), Currency.USD)  # the USD change request, caught at once
    except ValueError as e:
        print("stopped:", e)
