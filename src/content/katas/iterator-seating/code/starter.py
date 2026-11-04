class SeatingPlan:
    """A small cinema. rows[r][c] is True when that seat is sold."""

    def __init__(self, rows: list[list[bool]]) -> None:
        self.rows = rows


def label(row: int, col: int) -> str:
    return f"{chr(ord('A') + row)}{col + 1}"


# Every caller walks the nested lists itself, with its own row and column counters.
def count_free(plan: SeatingPlan) -> int:
    free = 0
    for r in range(len(plan.rows)):
        for c in range(len(plan.rows[r])):
            if not plan.rows[r][c]:
                free += 1
    return free


def first_free(plan: SeatingPlan) -> str:
    r = 0
    while r < len(plan.rows):
        c = 0
        while c < len(plan.rows[r]):
            if not plan.rows[r][c]:
                return label(r, c)
            c += 1
        r += 1
    return "sold out"


if __name__ == "__main__":
    plan = SeatingPlan([[True, True, False], [False, True], [True, False, False, False]])
    print("free seats:", count_free(plan))
    print("first free:", first_free(plan))
