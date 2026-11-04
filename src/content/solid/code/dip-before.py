# Before: the business rule builds its own database class. The arrow points down to a detail.


class MySqlOrderRepository:  # low-level detail
    def __init__(self) -> None:
        self._rows: dict[str, int] = {}  # stands in for a real MySQL connection

    def insert(self, order_id: str, amount: int) -> None:
        print(f"MySQL: INSERT INTO orders VALUES ('{order_id}', {amount})")
        self._rows[order_id] = amount


class OrderService:  # high-level business rule
    def __init__(self) -> None:
        self._repo = MySqlOrderRepository()  # hard-wired: can't swap, can't fake in tests

    def place(self, order_id: str, amount: int) -> str:
        if amount <= 0:
            raise ValueError("amount must be positive")
        self._repo.insert(order_id, amount)
        return f"order {order_id} placed"


if __name__ == "__main__":
    print(OrderService().place("A-101", 499))  # every run, even a unit test, talks to "MySQL"
