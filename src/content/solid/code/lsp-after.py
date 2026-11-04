# After: only types that can keep the refund promise make it. Every subtype is safe to pass.
from abc import ABC, abstractmethod


class PaymentMethod(ABC):  # every method can pay
    @abstractmethod
    def pay(self, amount: int) -> str: ...


class RefundablePayment(PaymentMethod):  # some can also refund
    @abstractmethod
    def refund(self, amount: int) -> str: ...


class Card(RefundablePayment):
    def pay(self, amount: int) -> str:
        return f"card charged {amount}"

    def refund(self, amount: int) -> str:
        return f"card refunded {amount}"


class GiftCard(PaymentMethod):  # makes no promise it can't keep
    def __init__(self, balance: int) -> None:
        self._balance = balance

    def pay(self, amount: int) -> str:
        self._balance -= amount
        return f"gift card used, {self._balance} left"


def cancel_order(method: RefundablePayment, amount: int) -> str:
    return method.refund(amount)  # any RefundablePayment works here


def checkout(method: PaymentMethod, amount: int) -> str:
    return method.pay(amount)  # any PaymentMethod works here


if __name__ == "__main__":
    print(checkout(Card(), 499))
    print(checkout(GiftCard(1000), 499))
    print(cancel_order(Card(), 499))
    # cancel_order(GiftCard(1000), 499) is now a type error, caught before it runs
