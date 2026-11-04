class Inventory:
    def reserve(self, sku: str, qty: int) -> bool:
        return True


class PaymentService:
    def charge(self, user: str, amount: int) -> str:
        return f"PAY-{user}-{amount}"


class ShippingService:
    def schedule(self, user: str, sku: str) -> str:
        return f"TRK-{sku}-{user}"


class Notifier:
    def send(self, user: str, text: str) -> None:
        print(f"to {user}: {text}")


# Every controller repeats the same four-service choreography, in the right order.
def checkout_controller(user: str, sku: str, amount: int) -> None:
    if Inventory().reserve(sku, 1):
        PaymentService().charge(user, amount)
        tracking = ShippingService().schedule(user, sku)
        Notifier().send(user, f"Order confirmed, tracking {tracking}")


def reorder_controller(user: str, sku: str, amount: int) -> None:
    if Inventory().reserve(sku, 1):           # copy-pasted; one day someone forgets a step
        PaymentService().charge(user, amount)
        tracking = ShippingService().schedule(user, sku)
        Notifier().send(user, f"Order confirmed, tracking {tracking}")


checkout_controller("asha", "BOOK-1", 399)
reorder_controller("ravi", "PEN-7", 49)
print("Each controller depends on 4 services and on the order of their calls")
