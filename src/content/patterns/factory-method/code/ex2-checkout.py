from abc import ABC, abstractmethod


class PaymentGateway(ABC):
    @abstractmethod
    def charge(self, amount: float) -> str: ...


class UpiGateway(PaymentGateway):
    def charge(self, amount: float) -> str:
        return f"UPI collect request for ₹{amount:.2f} sent"


class CardGateway(PaymentGateway):
    def charge(self, amount: float) -> str:
        fee = amount * 0.02
        return f"card charged ₹{amount + fee:.2f} (incl. 2% fee)"


class Checkout:
    def create_gateway(self) -> PaymentGateway:
        # factory method with a sensible default: UPI
        return UpiGateway()

    def pay(self, order_id: str, amount: float) -> str:
        if amount <= 0:
            return f"{order_id}: invalid amount"
        gateway = self.create_gateway()
        return f"{order_id}: {gateway.charge(amount)}"


class CardCheckout(Checkout):
    # only the creation step changes; pay() is inherited untouched
    def create_gateway(self) -> PaymentGateway:
        return CardGateway()


print(Checkout().pay("ORD-101", 499))
print(CardCheckout().pay("ORD-102", 1200))
print(Checkout().pay("ORD-103", 0))
