class Checkout:
    def pay(self, kind: str, amount: float) -> str:
        if kind == "card":
            return f"Paid ₹{amount} by card"
        elif kind == "upi":
            return f"Paid ₹{amount} via UPI"
        elif kind == "wallet":
            return f"Paid ₹{amount} from wallet"
        raise ValueError(kind)   # every new type edits this method


checkout = Checkout()
print(checkout.pay("card", 1200))
print(checkout.pay("upi", 1200))
try:
    checkout.pay("paylater", 1200)
except ValueError as error:
    print("Unsupported:", error, "-> edit Checkout.pay again")
