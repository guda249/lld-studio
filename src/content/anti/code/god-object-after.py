# After: each class owns one job; Checkout only coordinates them.
class Pricing:
    def __init__(self, prices: dict[str, int]) -> None:
        self._prices = prices

    def total(self, items: dict[str, int]) -> int:
        total = sum(self._prices[n] * q for n, q in items.items())
        return round(total * 0.9) if total > 300 else total


class Inventory:
    def __init__(self, stock: dict[str, int]) -> None:
        self._stock = stock

    def missing(self, items: dict[str, int]) -> str | None:
        return next((n for n, q in items.items() if self._stock.get(n, 0) < q), None)

    def take(self, items: dict[str, int]) -> None:
        for name, qty in items.items():
            self._stock[name] -= qty


class OrderBook:
    def __init__(self) -> None:
        self.orders: list[tuple[str, str, int]] = []

    def save(self, email: str, total: int) -> str:
        order_id = f"O{len(self.orders) + 1}"
        self.orders.append((order_id, email, total))
        return order_id


class Mailer:
    def __init__(self) -> None:
        self.outbox: list[str] = []

    def send(self, to: str, text: str) -> None:
        self.outbox.append(f"To {to}: {text}")


class Checkout:  # coordinates; holds no rules of its own
    def __init__(self, pricing: Pricing, inventory: Inventory, book: OrderBook, mailer: Mailer) -> None:
        self._pricing = pricing
        self._inventory = inventory
        self._book = book
        self._mailer = mailer

    def place_order(self, email: str, items: dict[str, int]) -> str:
        if (name := self._inventory.missing(items)) is not None:
            return f"Sorry, {name} is out of stock"
        total = self._pricing.total(items)
        self._inventory.take(items)
        order_id = self._book.save(email, total)
        self._mailer.send(email, f"order {order_id}, total {total}")
        return order_id


if __name__ == "__main__":
    mailer = Mailer()
    checkout = Checkout(Pricing({"pen": 20, "book": 150}), Inventory({"pen": 10, "book": 2}), OrderBook(), mailer)
    print(checkout.place_order("asha@example.com", {"book": 2, "pen": 1}))
    print(checkout.place_order("ravi@example.com", {"book": 1}))
    print(mailer.outbox[0])
