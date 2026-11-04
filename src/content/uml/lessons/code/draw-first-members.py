class Customer:
    def __init__(self, name: str, email: str):
        self.name = name                 # + name: str
        self.email = email               # + email: str


class LineItem:
    def __init__(self, product: str, price: float, qty: int):
        self.product = product
        self.price = price
        self.qty = qty

    def subtotal(self) -> float:         # + subtotal(): float
        return self.price * self.qty


class Order:
    def __init__(self, code: str):
        self.code = code
        self._paid = False               # - paid: bool (private)

    def pay(self) -> None:               # + pay()
        self._paid = True
        print(f"Order {self.code} paid")


print(LineItem("Book", 250.0, 2).subtotal())
Order("A-7").pay()
