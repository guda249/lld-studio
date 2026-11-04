from collections.abc import Callable
from decimal import ROUND_HALF_UP, Decimal

PayFn = Callable[[Decimal], str]  # the target is just "a function that pays"


class LegacyBankApi:  # adaptee: third-party, cannot change
    def make_transfer(self, amount_paise: int, currency_code: str) -> dict[str, str]:
        return {"status": "OK", "ref": f"TX{amount_paise}{currency_code}"}


def legacy_bank_adapter(api: LegacyBankApi) -> PayFn:  # the adapter is a closure
    def pay(amount_inr: Decimal) -> str:
        paise = int((amount_inr * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
        return api.make_transfer(paise, "INR")["ref"]

    return pay


def complete_checkout(pay: PayFn, amount_inr: Decimal) -> str:
    return f"Paid, reference {pay(amount_inr)}"


print(complete_checkout(legacy_bank_adapter(LegacyBankApi()), Decimal("499.50")))
print(complete_checkout(lambda amount: f"FAKE-{amount}", Decimal("10")))  # a test fake
