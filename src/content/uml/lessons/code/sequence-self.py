class Bill:
    def __init__(self, prices: list[int]):
        self.prices = prices

    def total(self) -> float:
        sub = self.subtotal()  # self-call
        return sub + self.tax(sub)  # self-call again

    def subtotal(self) -> int:
        return sum(self.prices)

    def tax(self, amount: int) -> float:
        return amount * 0.05


print(Bill([200, 300]).total())  # 525.0
