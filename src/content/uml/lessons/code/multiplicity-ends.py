class Customer:
    def __init__(self, name: str):
        self.name = name
        self.orders: list["Order"] = []   # read at the Order end: 0..* Orders


class Order:
    def __init__(self, id: str, customer: Customer):
        self.id = id
        self.customer = customer          # read at the Customer end: exactly 1
        customer.orders.append(self)


asha = Customer("Asha")
print(len(asha.orders))                   # 0: no orders yet is allowed
Order("A-1", asha)
Order("A-2", asha)
print([o.id for o in asha.orders], "->", asha.orders[0].customer.name)
