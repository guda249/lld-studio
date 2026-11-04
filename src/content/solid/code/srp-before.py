# Before: one class answers to finance, design and the platform team.
import json
from dataclasses import dataclass


@dataclass
class LineItem:
    name: str
    price: float
    qty: int


class Invoice:
    def __init__(self, number: str, items: list[LineItem]) -> None:
        self.number = number
        self.items = items

    def total(self) -> float:  # finance: prices and tax
        subtotal = sum(i.price * i.qty for i in self.items)
        return round(subtotal * 1.18, 2)  # 18% GST

    def render(self) -> str:  # design: how the invoice looks
        lines = [f"{i.name} x{i.qty}" for i in self.items]
        return "\n".join([f"INVOICE {self.number}", *lines, f"TOTAL {self.total():.2f}"])

    def save(self, disk: dict[str, str]) -> None:  # platform: where invoices live
        disk[self.number] = json.dumps({"number": self.number, "total": self.total()})


if __name__ == "__main__":
    disk: dict[str, str] = {}
    inv = Invoice("INV-7", [LineItem("Pen", 10.0, 3), LineItem("Notebook", 55.0, 2)])
    print(inv.render())
    inv.save(disk)
    print(disk)
