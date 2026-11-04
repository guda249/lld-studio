# After: Account guards its own rules; services only ask it to do things.
class Account:
    def __init__(self, owner: str, balance: int = 0) -> None:
        self.owner = owner
        self._balance = balance
        self._frozen = False

    @property
    def balance(self) -> int:  # readable, but only changed through the methods below
        return self._balance

    def freeze(self) -> None:
        self._frozen = True

    def withdraw(self, amount: int) -> str:
        if self._frozen:
            return "refused: account is frozen"
        if amount > self._balance:
            return "refused: not enough money"
        self._balance -= amount
        return f"ok, balance {self._balance}"


class FeeService:  # thin: decides WHEN to charge; Account decides IF it may
    def charge_late_fee(self, account: Account) -> str:
        return account.withdraw(200)


if __name__ == "__main__":
    acc = Account("asha", balance=100)
    acc.freeze()
    print(acc.withdraw(50))
    print(FeeService().charge_late_fee(acc), "| balance", acc.balance)
