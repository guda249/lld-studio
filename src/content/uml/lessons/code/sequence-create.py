class Order:
    def __init__(self, customer: str):
        self.customer = customer
        self.items: list[str] = []

    def add(self, item: str) -> None:
        self.items.append(item)


class OrderService:
    def place(self, customer: str, item: str) -> Order:
        order = Order(customer)  # «create»
        order.add(item)  # now it gets calls
        return order


order = OrderService().place("Asha", "Masala Dosa")
print(order.customer, order.items)
