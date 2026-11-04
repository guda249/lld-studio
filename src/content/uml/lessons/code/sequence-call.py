class PaymentGateway:
    def charge(self, amount: int) -> str:
        print(f"  gateway: charging ₹{amount}...")
        return "PAID"


class Checkout:
    def __init__(self, gateway: PaymentGateway):
        self.gateway = gateway

    def pay(self, amount: int) -> None:
        print("checkout: calling charge()")
        status = self.gateway.charge(amount)  # waits here
        print(f"checkout: got {status}, carry on")


Checkout(PaymentGateway()).pay(499)
