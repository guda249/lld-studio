# Template Method: the base class fixes the order of steps; each subclass fills in its own steps.
from abc import ABC, abstractmethod

Row = tuple[str, int]


class ReportExporter(ABC):
    def export_report(self, rows: list[Row]) -> str:  # the template method: the order lives here
        lines = [self.header()]
        for name, amount in rows:
            lines.append(self.format_row(name, amount))
        lines.append(self.footer(len(rows)))
        return "\n".join(lines)

    @abstractmethod
    def header(self) -> str: ...

    @abstractmethod
    def format_row(self, name: str, amount: int) -> str: ...

    def footer(self, count: int) -> str:  # hook: a default subclasses may replace
        return f"{count} rows"


class CsvExporter(ReportExporter):
    def header(self) -> str:
        return "item,amount"

    def format_row(self, name: str, amount: int) -> str:
        return f"{name},{amount}"


class MarkdownExporter(ReportExporter):
    def header(self) -> str:
        return "| item | amount |\n|---|---|"

    def format_row(self, name: str, amount: int) -> str:
        return f"| {name} | {amount} |"

    def footer(self, count: int) -> str:
        return f"_{count} rows_"


if __name__ == "__main__":
    rows = [("Pens", 1200), ("Paper", 950)]
    print(CsvExporter().export_report(rows))
    print(MarkdownExporter().export_report(rows))
