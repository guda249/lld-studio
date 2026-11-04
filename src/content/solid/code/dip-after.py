# After: the business layer owns the interface it needs; details implement it.
from abc import ABC, abstractmethod


class OrderRepository(ABC):  # abstraction, owned by the business side
    @abstractmethod
    def save(self, order_id: str, amount: int) -> None: ...

    @abstractmethod
    def find(self, order_id: str) -> int | None: ...


class OrderService:  # high-level: knows only the abstraction
    def __init__(self, repo: OrderRepository) -> None:
        self._repo = repo  # handed in from outside (dependency injection)

    def place(self, order_id: str, amount: int) -> str:
        if amount <= 0:
            raise ValueError("amount must be positive")
        self._repo.save(order_id, amount)
        return f"order {order_id} placed"


class MySqlOrderRepository(OrderRepository):  # detail for production
    def __init__(self) -> None:
        self._rows: dict[str, int] = {}

    def save(self, order_id: str, amount: int) -> None:
        print(f"MySQL: INSERT INTO orders VALUES ('{order_id}', {amount})")
        self._rows[order_id] = amount

    def find(self, order_id: str) -> int | None:
        return self._rows.get(order_id)


class InMemoryOrderRepository(OrderRepository):  # detail for tests: no database needed
    def __init__(self) -> None:
        self._rows: dict[str, int] = {}

    def save(self, order_id: str, amount: int) -> None:
        self._rows[order_id] = amount

    def find(self, order_id: str) -> int | None:
        return self._rows.get(order_id)


if __name__ == "__main__":
    # the composition root: the one place that picks concrete classes
    print(OrderService(MySqlOrderRepository()).place("A-101", 499))
    fake = InMemoryOrderRepository()
    print(OrderService(fake).place("T-1", 10), "| test sees", fake.find("T-1"))
