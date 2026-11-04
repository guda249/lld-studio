from abc import ABC, abstractmethod

Rows = list[tuple[str, float]]


class Renderer(ABC):  # implementation side: how output looks
    @abstractmethod
    def render(self, title: str, rows: Rows) -> str: ...


class CsvRenderer(Renderer):
    def render(self, title: str, rows: Rows) -> str:
        return "\n".join([f"# {title}"] + [f"{k},{v}" for k, v in rows])


class MarkdownRenderer(Renderer):
    def render(self, title: str, rows: Rows) -> str:
        lines = [f"## {title}", "| item | value |", "|---|---|"]
        return "\n".join(lines + [f"| {k} | {v} |" for k, v in rows])


class Report(ABC):  # abstraction side: what the report contains
    def __init__(self, renderer: Renderer) -> None:
        self._renderer = renderer  # the bridge

    @abstractmethod
    def generate(self) -> str: ...


class SalesReport(Report):
    def generate(self) -> str:
        return self._renderer.render("Sales", [("Mon", 1200.0), ("Tue", 950.0)])


class InventoryReport(Report):
    def generate(self) -> str:
        return self._renderer.render("Inventory", [("Pens", 40.0), ("Paper", 12.0)])


print(SalesReport(MarkdownRenderer()).generate())
print(InventoryReport(CsvRenderer()).generate())
