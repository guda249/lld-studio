class Inventory:
    def __init__(self):
        self.stock = {"pen": 3, "ink": 0}

    def in_stock(self, sku: str) -> bool:
        return self.stock.get(sku, 0) > 0  # return


class Cart:
    def __init__(self, inventory: Inventory):
        self.inventory = inventory

    def add(self, sku: str) -> str:
        ok = self.inventory.in_stock(sku)  # gets the return
        return f"{sku}: {'added' if ok else 'sold out'}"


cart = Cart(Inventory())
print(cart.add("pen"))  # pen: added
print(cart.add("ink"))  # ink: sold out
