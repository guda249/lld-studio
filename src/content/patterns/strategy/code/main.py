from abc import ABC, abstractmethod


class PaymentMethod(ABC):
    @abstractmethod
    def pay(self, amount: float) -> str: ...


class CardPayment(PaymentMethod):
    def pay(self, amount: float) -> str: return f"Paid ₹{amount} by card"


class UpiPayment(PaymentMethod):
    def pay(self, amount: float) -> str: return f"Paid ₹{amount} via UPI"


class WalletPayment(PaymentMethod):
    def pay(self, amount: float) -> str: return f"Paid ₹{amount} from wallet"


class Checkout:
    def __init__(self, method: PaymentMethod):
        self._method = method

    def set_method(self, method: PaymentMethod) -> None:
        self._method = method

    def pay(self, amount: float) -> str:
        return self._method.pay(amount)


class PayLaterPayment(PaymentMethod):   # new: nothing above changes
    def pay(self, amount: float) -> str: return f"Paid ₹{amount} with PayLater"


checkout = Checkout(CardPayment())
print(checkout.pay(1200))
checkout.set_method(UpiPayment())
print(checkout.pay(1200))
checkout.set_method(PayLaterPayment())
print(checkout.pay(1200))
