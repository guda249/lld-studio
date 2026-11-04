from abc import ABC, abstractmethod


class PayoutRail(ABC):  # implementation side: how the money moves
    @abstractmethod
    def transfer(self, driver: str, amount: float) -> str: ...


class BankRail(PayoutRail):
    def transfer(self, driver: str, amount: float) -> str:
        return f"bank transfer {amount:.2f} to {driver}'s account"


class WalletRail(PayoutRail):
    def transfer(self, driver: str, amount: float) -> str:
        return f"wallet top-up {amount:.2f} for {driver}"


class Payout(ABC):  # abstraction side: when and how much; the rail field is the bridge
    def __init__(self, rail: PayoutRail) -> None:
        self._rail = rail

    @abstractmethod
    def send(self, driver: str, amount: float) -> str: ...


class InstantPayout(Payout):
    def send(self, driver: str, amount: float) -> str:
        fee = round(amount * 0.015, 2)
        return f"instant (fee {fee:.2f}): " + self._rail.transfer(driver, amount - fee)


class ScheduledPayout(Payout):
    def send(self, driver: str, amount: float) -> str:
        return "friday batch: " + self._rail.transfer(driver, amount)


if __name__ == "__main__":
    bank, wallet = BankRail(), WalletRail()
    print(InstantPayout(bank).send("Lena", 200.0))
    print(InstantPayout(wallet).send("Omar", 80.0))
    print(ScheduledPayout(bank).send("Lena", 640.0))
    print(ScheduledPayout(wallet).send("Omar", 150.0))
