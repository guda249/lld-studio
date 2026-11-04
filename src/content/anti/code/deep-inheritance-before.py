# Before: every new combination of format + delivery becomes another level of subclass.
class Report:
    def __init__(self, rows: list[tuple[str, int]]) -> None:
        self.rows = rows

    def build(self) -> str:
        return "; ".join(f"{name}={value}" for name, value in self.rows)


class PdfReport(Report):
    def build(self) -> str:
        return "[PDF] " + super().build()


class EmailedPdfReport(PdfReport):
    def send(self, to: str) -> str:
        return f"mail to {to}: {self.build()}"


class ScheduledEmailedPdfReport(EmailedPdfReport):
    def run_monday(self, to: str) -> str:
        return "Mon 09:00 " + self.send(to)


class CsvReport(Report):
    def build(self) -> str:
        return "\n".join(f"{name},{value}" for name, value in self.rows)


class EmailedCsvReport(CsvReport):  # the change request: send() copied from EmailedPdfReport
    def send(self, to: str) -> str:
        return f"mail to {to}: {self.build()}"


if __name__ == "__main__":
    rows = [("pens", 12), ("books", 3)]
    print(ScheduledEmailedPdfReport(rows).run_monday("boss@shop.in"))
    print(EmailedCsvReport(rows).send("accounts@shop.in"))
