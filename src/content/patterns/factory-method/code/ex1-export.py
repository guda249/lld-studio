import json
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass


@dataclass
class Sale:
    city: str
    orders: int


class Formatter(ABC):
    @abstractmethod
    def format(self, sales: list[Sale]) -> str: ...


class CsvFormatter(Formatter):
    def format(self, sales: list[Sale]) -> str:
        lines = ["city,orders"] + [f"{s.city},{s.orders}" for s in sales]
        return "\n".join(lines)


class JsonFormatter(Formatter):
    def format(self, sales: list[Sale]) -> str:
        return json.dumps([asdict(s) for s in sales])


class ReportExporter(ABC):
    extension = "txt"

    @abstractmethod
    def create_formatter(self) -> Formatter:  # the factory method
        ...

    def export_report(self, name: str, sales: list[Sale]) -> str:
        # shared steps: check, format, add a header
        if not sales:
            return f"{name}: nothing to export"
        body = self.create_formatter().format(sales)
        return f"== {name}.{self.extension} ({len(sales)} rows) ==\n{body}"


class CsvExporter(ReportExporter):
    extension = "csv"

    def create_formatter(self) -> Formatter:
        return CsvFormatter()


class JsonExporter(ReportExporter):
    extension = "json"

    def create_formatter(self) -> Formatter:
        return JsonFormatter()


sales = [Sale("Pune", 120), Sale("Jaipur", 85)]
for exporter in (CsvExporter(), JsonExporter()):
    print(exporter.export_report("daily-sales", sales))
print(CsvExporter().export_report("empty-day", []))
