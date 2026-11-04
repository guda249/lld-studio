from dataclasses import dataclass


@dataclass
class Seat:
    label: str
    sold: bool


class SeatingPlan:
    """A small cinema. rows[r][c] is True when that seat is sold. Only this class knows that layout."""

    def __init__(self, rows: list[list[bool]]) -> None:
        self.rows = rows

    def __iter__(self) -> "SeatIterator":
        return SeatIterator(self)   # a fresh walk every time


class SeatIterator:
    """Walks the seats row by row and remembers where it is."""

    def __init__(self, plan: SeatingPlan) -> None:
        self._rows = plan.rows
        self._row = 0
        self._col = 0

    def __iter__(self) -> "SeatIterator":
        return self

    def __next__(self) -> Seat:
        while self._row < len(self._rows) and self._col >= len(self._rows[self._row]):
            self._row += 1      # end of this row: move to the next one
            self._col = 0
        if self._row >= len(self._rows):
            raise StopIteration
        seat = Seat(f"{chr(ord('A') + self._row)}{self._col + 1}", self._rows[self._row][self._col])
        self._col += 1
        return seat


# Callers use a plain for loop and never see rows or columns.
def count_free(plan: SeatingPlan) -> int:
    return sum(1 for seat in plan if not seat.sold)


def first_free(plan: SeatingPlan) -> str:
    return next((seat.label for seat in plan if not seat.sold), "sold out")


if __name__ == "__main__":
    plan = SeatingPlan([[True, True, False], [False, True], [True, False, False, False]])
    print("free seats:", count_free(plan))
    print("first free:", first_free(plan))
