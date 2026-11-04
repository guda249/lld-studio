# Before: Account is only data; the rules live in a manager, and anyone can skip them.
from dataclasses import dataclass


@dataclass
class Account:
    owner: str
    balance: int = 0
    frozen: bool = False


class AccountManager:
    def withdraw(self, account: Account, amount: int) -> str:
        if account.frozen:
            return "refused: account is frozen"
        if amount > account.balance:
            return "refused: not enough money"
        account.balance -= amount
        return f"ok, balance {account.balance}"


class FeeService:  # written later by another team; it never saw the rules
    def charge_late_fee(self, account: Account) -> None:
        account.balance -= 200


if __name__ == "__main__":
    acc = Account("asha", balance=100, frozen=True)
    print(AccountManager().withdraw(acc, 50))
    FeeService().charge_late_fee(acc)
    print("frozen account still lost money:", acc.balance)
