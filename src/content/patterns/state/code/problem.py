class Order:
    def __init__(self, order_id: str) -> None:
        self.order_id = order_id
        self.status = "placed"

    def ship(self) -> None:
        if self.status == "placed":
            self.status = "shipped"
        else:
            raise ValueError(f"Cannot ship an order that is {self.status}")

    def deliver(self) -> None:
        if self.status == "shipped":
            self.status = "delivered"
        else:
            raise ValueError(f"Cannot deliver an order that is {self.status}")

    def cancel(self) -> None:
        if self.status == "placed":
            self.status = "cancelled"
        elif self.status in ("shipped", "delivered"):
            raise ValueError("Too late to cancel")
        # forgot "cancelled": cancelling twice silently does nothing


order = Order("A-101")
order.ship()
order.deliver()
print(order.status)
print("Adding a 'packed' state means editing every method above.")
