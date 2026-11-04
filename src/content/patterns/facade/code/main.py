class Inventory:
    def __init__(self) -> None:
        self._stock = {"BOOK-1": 5, "PEN-7": 0}

    def reserve(self, sku: str, qty: int) -> bool:
        if self._stock.get(sku, 0) < qty:
            return False
        self._stock[sku] -= qty
        return True


class PaymentService:
    def charge(self, user: str, amount: int) -> str:
        return f"PAY-{user}-{amount}"


class ShippingService:
    def schedule(self, user: str, sku: str) -> str:
        return f"TRK-{sku}-{user}"


class Notifier:
    def send(self, user: str, text: str) -> None:
        print(f"  to {user}: {text}")


class OrderFacade:
    """One simple entry point. It only coordinates; the services do the work."""

    def __init__(self, inventory: Inventory, payments: PaymentService,
                 shipping: ShippingService, notifier: Notifier) -> None:
        self._inventory = inventory
        self._payments = payments
        self._shipping = shipping
        self._notifier = notifier

    def place_order(self, user: str, sku: str, qty: int, amount: int) -> str:
        if not self._inventory.reserve(sku, qty):
            return "Out of stock"
        payment_ref = self._payments.charge(user, amount)
        tracking = self._shipping.schedule(user, sku)
        self._notifier.send(user, f"Order confirmed, tracking {tracking}")
        return f"OK payment={payment_ref} tracking={tracking}"


inventory = Inventory()
shop = OrderFacade(inventory, PaymentService(), ShippingService(), Notifier())
print(shop.place_order("asha", "BOOK-1", 1, 399))
print(shop.place_order("ravi", "PEN-7", 2, 98))
# The subsystem is still there for advanced use: an admin checks stock directly.
print("admin can still reserve directly:", inventory.reserve("BOOK-1", 2))
