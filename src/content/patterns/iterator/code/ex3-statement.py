from collections.abc import Iterator
from dataclasses import dataclass


@dataclass(frozen=True)
class Txn:
    day: int
    source: str
    detail: str
    amount: int


class Feed:  # aggregate: one source of transactions, already sorted by day
    def __init__(self, source: str, rows: list[tuple[int, str, int]]) -> None:
        self._txns = [Txn(day, source, detail, amount) for day, detail, amount in rows]

    def __iter__(self) -> Iterator[Txn]:
        return iter(self._txns)


class MergedStatement:  # iterator built from two iterators: always yields the earlier item
    def __init__(self, left: Iterator[Txn], right: Iterator[Txn]) -> None:
        self._left, self._right = left, right
        self._a, self._b = next(left, None), next(right, None)  # one item of look-ahead each

    def __iter__(self) -> "MergedStatement":
        return self

    def __next__(self) -> Txn:
        a, b = self._a, self._b
        if a is None and b is None:
            raise StopIteration
        if a is not None and (b is None or a.day <= b.day):
            self._a = next(self._left, None)
            return a
        assert b is not None
        self._b = next(self._right, None)
        return b


upi = Feed("UPI", [(1, "Swiggy", -350), (4, "Salary", 85000), (9, "Rent", -22000)])
card = Feed("Card", [(2, "Amazon", -1299), (4, "Fuel", -2000), (12, "Netflix", -649)])

balance = 10000
for t in MergedStatement(iter(upi), iter(card)):
    balance += t.amount
    print(f"day {t.day:>2}  {t.source:<4}  {t.detail:<7} {t.amount:>+7}  balance {balance:>6}")
