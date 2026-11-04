# Strategy: the exporter keeps the order of steps and asks a format object, passed in, for each step.
from abc import ABC, abstractmethod

Row = tuple[str, int]


class RowFormat(ABC):  # strategy: every step a format must provide
    @abstractmethod
    def header(self) -> str: ...

    @abstractmethod
    def format_row(self, name: str, amount: int) -> str: ...

    @abstractmethod
    def footer(self, count: int) -> str: ...


class CsvFormat(RowFormat):
    def header(self) -> str:
        return "item,amount"

    def format_row(self, name: str, amount: int) -> str:
        return f"{name},{amount}"

    def footer(self, count: int) -> str:
        return f"{count} rows"


class MarkdownFormat(RowFormat):
    def header(self) -> str:
        return "| item | amount |\n|---|---|"

    def format_row(self, name: str, amount: int) -> str:
        return f"| {name} | {amount} |"

    def footer(self, count: int) -> str:
        return f"_{count} rows_"


class ReportExporter:  # context: holds a format and can switch it at runtime
    def __init__(self, fmt: RowFormat) -> None:
        self._fmt = fmt

    def set_format(self, fmt: RowFormat) -> None:
        self._fmt = fmt

    def export_report(self, rows: list[Row]) -> str:
        lines = [self._fmt.header()]
        for name, amount in rows:
            lines.append(self._fmt.format_row(name, amount))
        lines.append(self._fmt.footer(len(rows)))
        return "\n".join(lines)


if __name__ == "__main__":
    rows = [("Pens", 1200), ("Paper", 950)]
    exporter = ReportExporter(CsvFormat())
    print(exporter.export_report(rows))
    exporter.set_format(MarkdownFormat())  # same exporter object, new format
    print(exporter.export_report(rows))
