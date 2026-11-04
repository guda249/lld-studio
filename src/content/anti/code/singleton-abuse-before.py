# Before: every class reaches for the one global Database through Database.instance().
class Database:
    _instance: "Database | None" = None

    @classmethod
    def instance(cls) -> "Database":
        if cls._instance is None:
            cls._instance = Database()
        return cls._instance

    def __init__(self) -> None:
        self.rows: dict[str, int] = {}

    def save(self, key: str, amount: int) -> None:
        self.rows[key] = amount


class InvoiceService:
    def bill(self, customer: str, amount: int) -> str:
        Database.instance().save(customer, amount)  # hidden dependency
        return f"billed {customer} {amount}"


if __name__ == "__main__":
    print(InvoiceService().bill("asha", 500))
    # a "test" elsewhere sees asha's row too: state leaks between callers
    print("rows seen by everyone:", Database.instance().rows)
