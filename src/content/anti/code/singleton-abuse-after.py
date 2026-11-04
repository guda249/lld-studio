# After: InvoiceService asks for its Database in the constructor. main decides how many exist.
class Database:
    def __init__(self, name: str) -> None:
        self.name = name
        self.rows: dict[str, int] = {}

    def save(self, key: str, amount: int) -> None:
        self.rows[key] = amount


class InvoiceService:
    def __init__(self, db: Database) -> None:
        self._db = db  # the dependency is visible in the signature

    def bill(self, customer: str, amount: int) -> str:
        self._db.save(customer, amount)
        return f"billed {customer} {amount} in {self._db.name}"


if __name__ == "__main__":
    pune = Database("pune")  # created once here, the "composition root"
    mumbai = Database("mumbai")  # a second branch is now just a second object
    print(InvoiceService(pune).bill("asha", 500))
    print(InvoiceService(mumbai).bill("ravi", 300))
    test_db = Database("test")  # a test gets its own fresh, empty one
    print("pune rows:", pune.rows, "| test rows:", test_db.rows)
