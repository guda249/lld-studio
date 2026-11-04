from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class Txn:
    note: str
    amount: int          # positive = credit, negative = debit (in rupees)


class StatementGenerator(ABC):
    def generate(self, name: str, txns: list[Txn]) -> str:   # the template method
        lines = [self.header(name)]
        lines += [self.format_txn(t) for t in txns]
        lines.append(self.footer(sum(t.amount for t in txns)))
        return self.separator().join(lines)

    @abstractmethod
    def header(self, name: str) -> str: ...

    @abstractmethod
    def format_txn(self, txn: Txn) -> str: ...

    def footer(self, net: int) -> str:                       # hook
        return f"Net: ₹{net:,}"

    def separator(self) -> str:                              # hook
        return "\n"


class EmailStatement(StatementGenerator):
    def header(self, name: str) -> str:
        return f"Dear {name}, here is your October statement:"

    def format_txn(self, txn: Txn) -> str:
        return f"  {txn.note:<12} {txn.amount:+,}"


class SmsStatement(StatementGenerator):
    def header(self, name: str) -> str:
        return f"{name[:10]}:"

    def format_txn(self, txn: Txn) -> str:
        return f"{txn.note[:6]} {txn.amount:+}"

    def separator(self) -> str:                              # SMS must fit on one line
        return " | "


txns = [Txn("Salary", 85000), Txn("Rent UPI", -22000), Txn("Groceries", -6400)]
print(EmailStatement().generate("Priya", txns))
print(SmsStatement().generate("Priya", txns))
