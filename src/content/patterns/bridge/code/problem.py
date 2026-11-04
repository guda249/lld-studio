SALES = [("Mon", 1200.0), ("Tue", 950.0)]
STOCK = [("Pens", 40.0), ("Paper", 12.0)]


class SalesCsvReport:
    def generate(self) -> str:
        return "\n".join(["# Sales"] + [f"{k},{v}" for k, v in SALES])


class SalesMarkdownReport:
    def generate(self) -> str:
        lines = ["## Sales", "| item | value |", "|---|---|"]
        return "\n".join(lines + [f"| {k} | {v} |" for k, v in SALES])


class InventoryCsvReport:  # CSV formatting copied a second time
    def generate(self) -> str:
        return "\n".join(["# Inventory"] + [f"{k},{v}" for k, v in STOCK])


class InventoryMarkdownReport:  # Markdown formatting copied a second time
    def generate(self) -> str:
        lines = ["## Inventory", "| item | value |", "|---|---|"]
        return "\n".join(lines + [f"| {k} | {v} |" for k, v in STOCK])


print(InventoryCsvReport().generate())
classes = [SalesCsvReport, SalesMarkdownReport, InventoryCsvReport, InventoryMarkdownReport]
print(f"2 reports x 2 formats = {len(classes)} classes; adding PDF means 2 more, and a third report needs one class per format")
