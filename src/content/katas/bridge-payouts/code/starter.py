# One class per (payout speed x payment rail) pair. A third rail (UPI) would add two more
# classes, and a third speed would add one per rail: the count multiplies.

class InstantBankPayout:
    def send(self, driver: str, amount: float) -> str:
        fee = round(amount * 0.015, 2)
        return f"instant (fee {fee:.2f}): bank transfer {amount - fee:.2f} to {driver}'s account"


class InstantWalletPayout:
    def send(self, driver: str, amount: float) -> str:
        fee = round(amount * 0.015, 2)  # copied from InstantBankPayout
        return f"instant (fee {fee:.2f}): wallet top-up {amount - fee:.2f} for {driver}"


class ScheduledBankPayout:
    def send(self, driver: str, amount: float) -> str:
        return f"friday batch: bank transfer {amount:.2f} to {driver}'s account"


class ScheduledWalletPayout:
    def send(self, driver: str, amount: float) -> str:
        # the wallet text is copied from InstantWalletPayout
        return f"friday batch: wallet top-up {amount:.2f} for {driver}"


if __name__ == "__main__":
    print(InstantBankPayout().send("Lena", 200.0))
    print(InstantWalletPayout().send("Omar", 80.0))
    print(ScheduledBankPayout().send("Lena", 640.0))
    print(ScheduledWalletPayout().send("Omar", 150.0))
