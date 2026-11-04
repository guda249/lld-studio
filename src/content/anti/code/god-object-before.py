# Before: one ShopManager knows prices, stock, saving orders and sending emails.
class ShopManager:
    def __init__(self) -> None:
        self.prices = {"pen": 20, "book": 150}
        self.stock = {"pen": 10, "book": 2}
        self.orders: list[dict] = []
        self.outbox: list[str] = []

    def place_order(self, email: str, items: dict[str, int]) -> str:
        for name, qty in items.items():  # stock rules
            if self.stock.get(name, 0) < qty:
                return f"Sorry, {name} is out of stock"
        total = sum(self.prices[n] * q for n, q in items.items())  # pricing rules
        if total > 300:
            total = round(total * 0.9)
        for name, qty in items.items():  # stock again
            self.stock[name] -= qty
        order_id = f"O{len(self.orders) + 1}"  # saving
        self.orders.append({"id": order_id, "email": email, "total": total})
        self.outbox.append(f"To {email}: order {order_id}, total {total}")  # email
        return order_id

    def restock(self, name: str, qty: int) -> None:
        self.stock[name] = self.stock.get(name, 0) + qty

    def sales_report(self) -> str:
        return f"{len(self.orders)} orders, {sum(o['total'] for o in self.orders)} rupees"


if __name__ == "__main__":
    shop = ShopManager()
    print(shop.place_order("asha@example.com", {"book": 2, "pen": 1}))
    print(shop.place_order("ravi@example.com", {"book": 1}))
    print(shop.sales_report(), "|", shop.outbox[0])
