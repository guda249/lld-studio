# Before: GiftCard says it is a PaymentMethod, but it can't do everything a PaymentMethod promises.
from abc import ABC, abstractmethod


class PaymentMethod(ABC):
    @abstractmethod
    def pay(self, amount: int) -> str: ...

    @abstractmethod
    def refund(self, amount: int) -> str: ...


class Card(PaymentMethod):
    def pay(self, amount: int) -> str:
        return f"card charged {amount}"

    def refund(self, amount: int) -> str:
        return f"card refunded {amount}"


class GiftCard(PaymentMethod):
    def __init__(self, balance: int) -> None:
        self._balance = balance

    def pay(self, amount: int) -> str:
        self._balance -= amount
        return f"gift card used, {self._balance} left"

    def refund(self, amount: int) -> str:
        raise NotImplementedError("gift cards can't be refunded")  # breaks the promise


def cancel_order(method: PaymentMethod, amount: int) -> str:  # written long before GiftCard
    return method.refund(amount)


if __name__ == "__main__":
    print(cancel_order(Card(), 499))
    try:
        print(cancel_order(GiftCard(1000), 499))
    except NotImplementedError as e:
        print("crash in cancel_order:", e)
