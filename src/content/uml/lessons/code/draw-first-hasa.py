from abc import ABC, abstractmethod


class Notifier(ABC):
    @abstractmethod
    def send(self, text: str) -> None: ...


class Customer:
    def __init__(self, name: str):
        self.name = name


class LineItem:
    def __init__(self, product: str, price: float):
        self.product = product
        self.price = price


class Receipt:
    def __init__(self, total: float):
        self.total = total


class Order:
    def __init__(self, customer: Customer):
        self.customer = customer               # passed in, kept: association
        self.items: list[LineItem] = []        # a collection of parts: aggregation
        self.receipt = Receipt(0.0)            # created here: composition

    def add(self, item: LineItem) -> None:     # items are made outside, then added
        self.items.append(item)
        self.receipt.total += item.price

    def place(self, notifier: Notifier) -> None:   # only a parameter: dependency
        notifier.send(f"{self.customer.name} paid {self.receipt.total}")


class PrintNotifier(Notifier):
    def send(self, text: str) -> None:
        print(text)


order = Order(Customer("Asha"))
order.add(LineItem("Book", 250.0))
order.add(LineItem("Pen", 20.0))
order.place(PrintNotifier())
