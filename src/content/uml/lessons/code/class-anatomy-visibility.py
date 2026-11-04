class Account:
    def __init__(self, owner: str, balance: float, limit: float):
        self.owner = owner                # + public: anyone may use it
        self.__balance = balance          # - private: only Account (name-mangled)
        self._limit = limit               # # protected: Account and its subclasses

    def _audit(self) -> str:              # ~ package: no keyword in Python; "_" + same module
        return f"{self.owner}: {self.__balance}"


class SavingsAccount(Account):
    def allows(self, amount: float) -> bool:
        return amount <= self._limit      # a subclass may use # members


acc = SavingsAccount("Asha", 5000.0, 2000.0)
print(acc.owner, acc.allows(1500.0), acc._audit())   # Asha True Asha: 5000.0
