from abc import ABC, abstractmethod


class PaymentClient(ABC):
    @abstractmethod
    def pay(self, amount: int) -> str: ...  # returns a transaction id


class RefundClient(ABC):
    @abstractmethod
    def refund(self, txn_id: str) -> str: ...


class UpiPaymentClient(PaymentClient):
    def pay(self, amount: int) -> str:
        return f"UPI-{amount}"


class UpiRefundClient(RefundClient):
    def refund(self, txn_id: str) -> str:
        if not txn_id.startswith("UPI-"):
            return f"rejected {txn_id}: not a UPI transaction"
        return f"refunded {txn_id} to the payer's bank account"


class CardPaymentClient(PaymentClient):
    def pay(self, amount: int) -> str:
        return f"CARD-{amount}"


class CardRefundClient(RefundClient):
    def refund(self, txn_id: str) -> str:
        if not txn_id.startswith("CARD-"):
            return f"rejected {txn_id}: not a card transaction"
        return f"refunded {txn_id} to the card in 5-7 days"


class ProviderFactory(ABC):
    @abstractmethod
    def create_payment_client(self) -> PaymentClient: ...

    @abstractmethod
    def create_refund_client(self) -> RefundClient: ...


class UpiProvider(ProviderFactory):
    def create_payment_client(self) -> PaymentClient:
        return UpiPaymentClient()

    def create_refund_client(self) -> RefundClient:
        return UpiRefundClient()


class CardProvider(ProviderFactory):
    def create_payment_client(self) -> PaymentClient:
        return CardPaymentClient()

    def create_refund_client(self) -> RefundClient:
        return CardRefundClient()


PROVIDERS: dict[str, ProviderFactory] = {"upi": UpiProvider(), "card": CardProvider()}


def provider_for(method: str) -> ProviderFactory:
    # unknown methods fall back to UPI, the cheapest family
    return PROVIDERS.get(method, PROVIDERS["upi"])


for method in ("upi", "card", "wallet"):
    provider = provider_for(method)
    txn = provider.create_payment_client().pay(750)
    print(f"{method}: paid {txn}, {provider.create_refund_client().refund(txn)}")
