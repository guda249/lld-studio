# A class is a blueprint. An object is one thing built from that blueprint.


class BankAccount:
    def __init__(self, owner: str) -> None:
        self.owner = owner  # public: anyone may read it
        self._balance = 0  # leading _ means "private by agreement": only this class touches it

    def deposit(self, amount: int) -> None:
        if amount <= 0:
            raise ValueError("deposit must be positive")
        self._balance += amount

    def withdraw(self, amount: int) -> None:
        if amount > self._balance:  # the class guards its own rule
            raise ValueError("not enough money")
        self._balance -= amount

    def balance(self) -> int:
        return self._balance


if __name__ == "__main__":
    asha = BankAccount("Asha")  # two objects from one class,
    ravi = BankAccount("Ravi")  # each with its own balance
    asha.deposit(500)
    asha.withdraw(120)
    ravi.deposit(50)
    print(asha.owner, asha.balance())  # Asha 380
    print(ravi.owner, ravi.balance())  # Ravi 50
    try:
        ravi.withdraw(999)
    except ValueError as e:
        print("refused:", e)
