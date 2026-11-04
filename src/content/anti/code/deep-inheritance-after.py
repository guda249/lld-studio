# After: Report HAS a format and a delivery; each varies on its own, no new levels.
from abc import ABC, abstractmethod


class Formatter(ABC):
    @abstractmethod
    def render(self, rows: list[tuple[str, int]]) -> str: ...


class PdfFormat(Formatter):
    def render(self, rows: list[tuple[str, int]]) -> str:
        return "[PDF] " + "; ".join(f"{n}={v}" for n, v in rows)


class CsvFormat(Formatter):
    def render(self, rows: list[tuple[str, int]]) -> str:
        return "\n".join(f"{n},{v}" for n, v in rows)


class Delivery(ABC):
    @abstractmethod
    def deliver(self, text: str) -> str: ...


class EmailDelivery(Delivery):
    def __init__(self, to: str) -> None:
        self.to = to

    def deliver(self, text: str) -> str:
        return f"mail to {self.to}: {text}"


class Report:
    def __init__(self, rows: list[tuple[str, int]], formatter: Formatter, delivery: Delivery) -> None:
        self.rows = rows
        self.formatter = formatter
        self.delivery = delivery

    def run(self) -> str:
        return self.delivery.deliver(self.formatter.render(self.rows))


if __name__ == "__main__":
    rows = [("pens", 12), ("books", 3)]
    print(Report(rows, PdfFormat(), EmailDelivery("boss@shop.in")).run())
    print(Report(rows, CsvFormat(), EmailDelivery("accounts@shop.in")).run())  # the change: no new class
