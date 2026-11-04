from decimal import Decimal


class LegacyBankApi:  # third-party SDK we cannot edit
    def make_transfer(self, amount_paise: int, currency_code: str) -> dict[str, str]:
        return {"status": "OK", "ref": f"TX{amount_paise}{currency_code}"}


bank = LegacyBankApi()


def checkout(amount_inr: Decimal) -> str:
    response = bank.make_transfer(int(amount_inr * 100), "INR")  # SDK units leak in here
    return f"Order paid, ref {response['ref']}"


def wallet_top_up(amount_inr: Decimal) -> str:
    response = bank.make_transfer(int(amount_inr * 100), "INR")  # ...and here, copied
    return f"Wallet topped up, ref {response['ref']}"


def subscription(amount_inr: Decimal) -> str:
    response = bank.make_transfer(int(amount_inr), "INR")  # forgot the x100: 1/100th charged
    return f"Subscription paid, ref {response['ref']}"


print(checkout(Decimal("499.50")))
print(wallet_top_up(Decimal("1000")))
print(subscription(Decimal("199")))
print("Three call sites know the SDK's paise and dict format; a new bank means editing all three")
