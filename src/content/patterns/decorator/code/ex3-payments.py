from abc import ABC, abstractmethod


class PaymentGateway(ABC):
    @abstractmethod
    def pay(self, user: str, amount: int) -> str: ...


class UpiGateway(PaymentGateway):
    def __init__(self) -> None:
        self._next_ref = 1000

    def pay(self, user: str, amount: int) -> str:
        self._next_ref += 1
        return f"UPI-{self._next_ref}"


# Stackable mixins: each one adds a behaviour and calls super(),
# which goes to the NEXT class in the method resolution order.
class Audited(PaymentGateway):
    def pay(self, user: str, amount: int) -> str:
        ref = super().pay(user, amount)
        print(f"AUDIT {user} paid ₹{amount} ref={ref}")
        return ref


class Metered(PaymentGateway):
    calls = 0
    volume = 0

    def pay(self, user: str, amount: int) -> str:
        self.calls += 1
        self.volume += amount
        return super().pay(user, amount)


# Order of layers: Audited -> Metered -> UpiGateway
class ProductionGateway(Audited, Metered, UpiGateway):
    pass


plain = UpiGateway()
print("plain:", plain.pay("test-user", 1))

gateway = ProductionGateway()
gateway.pay("asha", 499)
gateway.pay("ravi", 1200)
print(f"metrics: {gateway.calls} payments, ₹{gateway.volume} total")
