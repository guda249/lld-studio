class Stock:
    def __init__(self):
        self.left = {"pen": 5, "ink": 0}

    def reserve(self, item: str) -> bool:
        return self.left.get(item, 0) > 0


class Checkout:
    def __init__(self, stock: Stock):
        self.stock = stock

    def run(self, items: list[str]) -> str:
        ok = True
        for item in items:  # loop
            ok = self.stock.reserve(item) and ok
        if ok:  # alt [ok]
            return "charged"
        else:  # [else]
            return "cancelled"


print(Checkout(Stock()).run(["pen"]))  # charged
print(Checkout(Stock()).run(["pen", "ink"]))  # cancelled
