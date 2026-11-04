class OrderLine:
    def __init__(self, item: str, qty: int):
        self.item = item
        self.qty = qty


class Order:
    def __init__(self, first: OrderLine, *more: OrderLine):   # 1..*: at least one
        self.lines = [first, *more]


print(len(Order(OrderLine("tea", 2)).lines))                        # 1
print(len(Order(OrderLine("tea", 2), OrderLine("mug", 1)).lines))   # 2
try:
    Order()                                # zero lines: not allowed
except TypeError as e:
    print("error:", e)
