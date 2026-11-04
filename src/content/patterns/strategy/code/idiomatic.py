from typing import Callable

PayFn = Callable[[float], str]


class Checkout:
    def __init__(self, pay: PayFn):
        self._pay = pay

    def pay(self, amount: float) -> str:
        return self._pay(amount)


def upi(amount: float) -> str:
    return f"Paid ₹{amount} via UPI"


def card(amount: float) -> str:
    return f"Paid ₹{amount} by card"


print(Checkout(upi).pay(500))
print(Checkout(card).pay(500))
print(Checkout(lambda a: f"Paid ₹{a} with PayLater").pay(500))   # a strategy made on the spot
