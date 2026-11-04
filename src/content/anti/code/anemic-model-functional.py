# Also fine: immutable data + the functions that own its rules, kept side by side.
from dataclasses import dataclass, replace


@dataclass(frozen=True)  # nobody can do acc.balance -= 200 by accident
class Account:
    owner: str
    balance: int
    frozen: bool = False


def withdraw(acc: Account, amount: int) -> Account | str:
    if acc.frozen:
        return "refused: account is frozen"
    if amount > acc.balance:
        return "refused: not enough money"
    return replace(acc, balance=acc.balance - amount)  # a new value; the old one is untouched


if __name__ == "__main__":
    acc = Account("asha", 100)
    print(withdraw(acc, 30))
    print(withdraw(replace(acc, frozen=True), 30))
