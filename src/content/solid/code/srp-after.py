# After: three classes, each with one reason to change.
import json
from dataclasses import dataclass


@dataclass
class LineItem:
    name: str
    price: float
    qty: int


class Invoice:  # finance owns this: prices and tax only
    def __init__(self, number: str, items: list[LineItem]) -> None:
        self.number = number
        self.items = items

    def total(self) -> float:
        subtotal = sum(i.price * i.qty for i in self.items)
        return round(subtotal * 1.18, 2)


class InvoiceRenderer:  # design owns this: layout only
    def render(self, inv: Invoice) -> str:
        lines = [f"{i.name} x{i.qty}" for i in inv.items]
        return "\n".join([f"INVOICE {inv.number}", *lines, f"TOTAL {inv.total():.2f}"])


class InvoiceStore:  # platform owns this: storage only
    def __init__(self) -> None:
        self._disk: dict[str, str] = {}

    def save(self, inv: Invoice) -> None:
        self._disk[inv.number] = json.dumps({"number": inv.number, "total": inv.total()})

    def load(self, number: str) -> str:
        return self._disk[number]


if __name__ == "__main__":
    inv = Invoice("INV-7", [LineItem("Pen", 10.0, 3), LineItem("Notebook", 55.0, 2)])
    print(InvoiceRenderer().render(inv))
    store = InvoiceStore()
    store.save(inv)
    print(store.load("INV-7"))
