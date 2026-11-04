from abc import ABC, abstractmethod
from decimal import ROUND_HALF_UP, Decimal


class PaymentGateway(ABC):  # target: what our code expects
    @abstractmethod
    def pay(self, amount_inr: Decimal) -> str: ...


class LegacyBankApi:  # adaptee: third-party, cannot change
    def make_transfer(self, amount_paise: int, currency_code: str) -> dict[str, str]:
        return {"status": "OK", "ref": f"TX{amount_paise}{currency_code}"}


class LegacyBankAdapter(PaymentGateway):  # adapter
    def __init__(self, api: LegacyBankApi) -> None:
        self._api = api

    def pay(self, amount_inr: Decimal) -> str:
        paise = int((amount_inr * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
        response = self._api.make_transfer(paise, "INR")
        if response["status"] != "OK":
            raise RuntimeError("payment failed")
        return response["ref"]


class Checkout:  # client: only knows PaymentGateway
    def __init__(self, gateway: PaymentGateway) -> None:
        self._gateway = gateway

    def complete(self, amount_inr: Decimal) -> str:
        return f"Paid ₹{amount_inr}, reference {self._gateway.pay(amount_inr)}"


checkout = Checkout(LegacyBankAdapter(LegacyBankApi()))
print(checkout.complete(Decimal("499.50")))
print(checkout.complete(Decimal("199")))
