# Before: ids are str, money is float, status is str. Python can't tell any of them apart.
def add_price(total: float, price: float) -> float:
    return total + price


def refund(order_id: str, customer_id: str, amount: float, currency: str, status: str) -> str:
    if status != "delivered":
        return f"no refund for {order_id}: status is {status!r}"
    return f"refund {amount} {currency} to {customer_id} for order {order_id}"


if __name__ == "__main__":
    total = 0.0
    for price in [0.10, 0.20]:
        total = add_price(total, price)
    print("total:", total)  # 0.30000000000000004
    print(refund("O-1001", "C-77", total, "INR", "Delivered"))  # typo in status: refund wrongly refused
    print(refund("C-77", "O-1001", 5.0, "inr", "delivered"))  # ids swapped, odd currency: runs anyway
