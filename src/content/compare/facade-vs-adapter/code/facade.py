# Facade: the courier's SDK has several classes. One class runs the whole flow for us.


class RateCard:
    def price(self, grams: int, pincode: str) -> int:
        far_away = 20 if pincode.startswith("7") else 0
        return 40 + (grams // 500) * 15 + far_away


class LabelPrinter:
    def print_label(self, order_id: str, pincode: str) -> str:
        return f"LBL-{order_id}-{pincode}"


class PickupScheduler:
    def book_pickup(self, label: str) -> str:
        return f"pickup of {label} booked"


class ShippingFacade:
    """One simple call. It only coordinates; the SDK classes do the work."""

    def __init__(self, rates: RateCard, labels: LabelPrinter, pickups: PickupScheduler) -> None:
        self._rates = rates
        self._labels = labels
        self._pickups = pickups

    def ship(self, order_id: str, weight_kg: float, pincode: str) -> str:
        grams = round(weight_kg * 1000)
        cost = self._rates.price(grams, pincode)
        label = self._labels.print_label(order_id, pincode)
        pickup = self._pickups.book_pickup(label)
        return f"{order_id}: ₹{cost}, {pickup}"


class Checkout:  # client: makes one call instead of three
    def __init__(self, shipping: ShippingFacade) -> None:
        self._shipping = shipping

    def complete(self, order_id: str, weight_kg: float, pincode: str) -> str:
        return "Order placed. " + self._shipping.ship(order_id, weight_kg, pincode)


if __name__ == "__main__":
    checkout = Checkout(ShippingFacade(RateCard(), LabelPrinter(), PickupScheduler()))
    print(checkout.complete("A101", 1.2, "560001"))
    print(checkout.complete("A102", 0.4, "700019"))
