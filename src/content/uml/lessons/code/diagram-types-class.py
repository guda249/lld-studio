class Customer:
    def __init__(self, name: str):
        self.name = name


class Order:
    def __init__(self, id: str, customer: Customer):
        self.id = id
        self.customer = customer          # the line Order → Customer

    def total(self) -> float:
        return 499.0


order = Order("A-101", Customer("Asha"))
print(order.id, order.customer.name, order.total())   # A-101 Asha 499.0
