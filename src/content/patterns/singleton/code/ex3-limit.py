from dataclasses import dataclass, field


@dataclass
class DailyLimit:
    """Tracks how much each user sent today. One per app, but not a global."""

    cap_inr: int
    spent: dict[str, int] = field(default_factory=dict)

    def try_spend(self, user: str, amount: int) -> bool:
        used = self.spent.get(user, 0)
        if used + amount > self.cap_inr:
            return False
        self.spent[user] = used + amount
        return True


class UpiTransferService:
    def __init__(self, limit: DailyLimit) -> None:
        self._limit = limit

    def send(self, user: str, amount: int) -> str:
        ok = self._limit.try_spend(user, amount)
        return f"UPI ₹{amount} for {user}: {'sent' if ok else 'blocked by daily limit'}"


class BillPayService:
    def __init__(self, limit: DailyLimit) -> None:
        self._limit = limit

    def pay(self, user: str, biller: str, amount: int) -> str:
        ok = self._limit.try_spend(user, amount)
        return f"Bill {biller} ₹{amount} for {user}: {'paid' if ok else 'blocked by daily limit'}"


def build_app() -> tuple[UpiTransferService, BillPayService]:
    limit = DailyLimit(cap_inr=100_000)  # the one shared instance, made at startup
    return UpiTransferService(limit), BillPayService(limit)


upi, bills = build_app()
print(upi.send("asha", 60_000))
print(bills.pay("asha", "BESCOM", 30_000))
print(upi.send("asha", 20_000))  # both services see the same running total

# A test builds its own small limit: nothing global to reset afterwards.
test_upi = UpiTransferService(DailyLimit(cap_inr=500))
print(test_upi.send("test-user", 600))
