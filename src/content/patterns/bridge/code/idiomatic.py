from collections.abc import Callable
from dataclasses import dataclass

Rows = list[tuple[str, float]]
Render = Callable[[str, Rows], str]  # the implementation side is one function


def to_csv(title: str, rows: Rows) -> str:
    return "\n".join([f"# {title}"] + [f"{k},{v}" for k, v in rows])


def to_plain(title: str, rows: Rows) -> str:
    return f"{title}: " + ", ".join(f"{k}={v}" for k, v in rows)


@dataclass
class SalesReport:
    render: Render  # the bridge is now a function field

    def generate(self) -> str:
        return self.render("Sales", [("Mon", 1200.0), ("Tue", 950.0)])


print(SalesReport(to_csv).generate())
print(SalesReport(to_plain).generate())
