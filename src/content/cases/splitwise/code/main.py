from abc import ABC, abstractmethod
from dataclasses import dataclass


def money(cents: int) -> str:
    sign = "-" if cents < 0 else ""
    return f"{sign}₹{abs(cents) // 100}.{abs(cents) % 100:02d}"


@dataclass(frozen=True)
class User:
    user_id: str
    name: str


# ---------- Strategy: how one bill is cut into shares (amounts are whole paise, never floats) ----------
class SplitStrategy(ABC):
    @abstractmethod
    def label(self) -> str: ...

    @abstractmethod
    def split(self, total: int, users: list[User]) -> dict[User, int]: ...


class EqualSplit(SplitStrategy):
    def label(self) -> str:
        return "equal"

    def split(self, total: int, users: list[User]) -> dict[User, int]:
        base, extra = divmod(total, len(users))
        # the first `extra` people pay one paisa more, so the shares always add up to the total
        return {u: base + (1 if i < extra else 0) for i, u in enumerate(users)}


class ExactSplit(SplitStrategy):
    def __init__(self, amounts: dict[str, int]) -> None:
        self._amounts = amounts

    def label(self) -> str:
        return "exact"

    def split(self, total: int, users: list[User]) -> dict[User, int]:
        shares = {u: self._amounts.get(u.user_id, 0) for u in users}
        if sum(shares.values()) != total:
            raise ValueError(f"exact amounts add up to {money(sum(shares.values()))}, not {money(total)}")
        return shares


class PercentSplit(SplitStrategy):
    def __init__(self, percents: dict[str, int]) -> None:
        self._percents = percents

    def label(self) -> str:
        return "percent"

    def split(self, total: int, users: list[User]) -> dict[User, int]:
        if sum(self._percents.get(u.user_id, 0) for u in users) != 100:
            raise ValueError("percentages must add up to 100")
        shares = {u: total * self._percents.get(u.user_id, 0) // 100 for u in users}
        shares[users[0]] += total - sum(shares.values())  # rounding leftovers go to the first person
        return shares


@dataclass(frozen=True)
class Expense:
    expense_id: int
    description: str
    paid_by: User
    total: int
    shares: dict[User, int]
    how: str


# ---------- Observer: whoever cares about a new expense subscribes to the group ----------
class ExpenseListener(ABC):
    @abstractmethod
    def on_expense(self, expense: Expense) -> None: ...


class BalanceSheet(ExpenseListener):
    """Keeps one net number per person: positive = others owe them, negative = they owe."""

    def __init__(self) -> None:
        self._net: dict[User, int] = {}

    def on_expense(self, expense: Expense) -> None:
        self._net[expense.paid_by] = self._net.get(expense.paid_by, 0) + expense.total
        for user, share in expense.shares.items():
            self._net[user] = self._net.get(user, 0) - share

    def balance_of(self, user: User) -> int:
        return self._net.get(user, 0)

    def settle_up(self) -> list[tuple[User, User, int]]:
        """Greedy: the biggest debtor pays the biggest creditor until everyone is at zero."""
        order = lambda pair: (-pair[1], pair[0].name)
        creditors = sorted([(u, n) for u, n in self._net.items() if n > 0], key=order)
        debtors = sorted([(u, -n) for u, n in self._net.items() if n < 0], key=order)
        transfers: list[tuple[User, User, int]] = []
        i = j = 0
        while i < len(debtors) and j < len(creditors):
            (debtor, owes), (creditor, gets) = debtors[i], creditors[j]
            pay = min(owes, gets)
            transfers.append((debtor, creditor, pay))
            debtors[i], creditors[j] = (debtor, owes - pay), (creditor, gets - pay)
            if owes == pay:
                i += 1
            if gets == pay:
                j += 1
        return transfers


class ActivityFeed(ExpenseListener):
    def __init__(self) -> None:
        self._lines: list[str] = []

    def on_expense(self, expense: Expense) -> None:
        names = ", ".join(f"{u.name} {money(s)}" for u, s in expense.shares.items())
        self._lines.append(f"#{expense.expense_id} {expense.paid_by.name} paid {money(expense.total)} "
                           f"for {expense.description} ({expense.how}: {names})")

    def lines(self) -> list[str]:
        return list(self._lines)


class Group:
    def __init__(self, name: str, members: list[User]) -> None:
        self.name = name
        self._members = members
        self._expenses: list[Expense] = []
        self._listeners: list[ExpenseListener] = []

    def subscribe(self, listener: ExpenseListener) -> None:
        self._listeners.append(listener)

    def add_expense(self, description: str, paid_by: User, total: int,
                    among: list[User], strategy: SplitStrategy) -> Expense:
        if total <= 0:
            raise ValueError("amount must be positive")
        if any(u not in self._members for u in [paid_by, *among]):
            raise ValueError("everyone in an expense must be in the group")
        shares = strategy.split(total, among)
        expense = Expense(len(self._expenses) + 1, description, paid_by, total, shares, strategy.label())
        self._expenses.append(expense)
        for listener in self._listeners:
            listener.on_expense(expense)
        return expense

    def settle(self, debtor: User, creditor: User, amount: int) -> Expense:
        # a repayment is just an expense paid by the debtor that belongs entirely to the creditor
        return self.add_expense("settle up", debtor, amount, [creditor], ExactSplit({creditor.user_id: amount}))


if __name__ == "__main__":
    asha, ben, chen, dev = User("u1", "Asha"), User("u2", "Ben"), User("u3", "Chen"), User("u4", "Dev")
    trip = Group("Goa trip", [asha, ben, chen, dev])
    sheet, feed = BalanceSheet(), ActivityFeed()
    trip.subscribe(sheet)
    trip.subscribe(feed)

    trip.add_expense("dinner", asha, 100000, [asha, ben, chen], EqualSplit())
    trip.add_expense("cab", ben, 45000, [asha, ben, chen], ExactSplit({"u1": 15000, "u2": 10000, "u3": 20000}))
    trip.add_expense("hotel", chen, 600000, [asha, ben, chen, dev],
                     PercentSplit({"u1": 40, "u2": 30, "u3": 20, "u4": 10}))
    try:
        trip.add_expense("snacks", dev, 9000, [ben, dev], PercentSplit({"u2": 50, "u4": 40}))
    except ValueError as err:
        print("Rejected:", err)

    for line in feed.lines():
        print(line)
    print("Balances:", ", ".join(f"{u.name} {money(sheet.balance_of(u))}" for u in [asha, ben, chen, dev]))
    plan = sheet.settle_up()
    for debtor, creditor, amount in plan:
        print(f"{debtor.name} pays {creditor.name} {money(amount)}")
    for debtor, creditor, amount in plan:
        trip.settle(debtor, creditor, amount)
    print("After settling:", ", ".join(f"{u.name} {money(sheet.balance_of(u))}" for u in [asha, ben, chen, dev]))
