class Cart:
    def total(self) -> int:
        return 499


class Payment:
    def charge(self, amount: int) -> str:
        return f"paid {amount}"


def checkout(cart: Cart, payment: Payment) -> str:
    amount = cart.total()                 # 1. ask the cart, 2. it answers
    return payment.charge(amount)         # 3. charge, 4. the answer comes back


print(checkout(Cart(), Payment()))        # paid 499
