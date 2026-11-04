class Receipt:
    def __init__(self, amount: int):
        self.amount = amount


class Gateway:
    def charge(self, amount: int) -> Receipt:
        return Receipt(amount)  # 3 «create», 4 return


class Shop:
    def __init__(self, gateway: Gateway):
        self.gateway = gateway

    def buy(self, price: int) -> str:
        receipt = self.gateway.charge(price)  # 2
        self.log(receipt)  # 5 self-call
        return "thanks"  # 6 return

    def log(self, receipt: Receipt) -> None:
        print(f"paid ₹{receipt.amount}")


print(Shop(Gateway()).buy(250))  # 1
