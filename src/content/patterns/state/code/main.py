class OrderState:                             # state: every action is "not allowed" by default
    name = "unknown"

    def ship(self) -> "OrderState":
        return self._invalid("ship")

    def deliver(self) -> "OrderState":
        return self._invalid("deliver")

    def cancel(self) -> "OrderState":
        return self._invalid("cancel")

    def _invalid(self, action: str) -> "OrderState":
        raise ValueError(f"Cannot {action} an order that is {self.name}")


class Placed(OrderState):
    name = "placed"

    def ship(self) -> OrderState:
        return Shipped()

    def cancel(self) -> OrderState:
        return Cancelled()


class Shipped(OrderState):
    name = "shipped"

    def deliver(self) -> OrderState:
        return Delivered()


class Delivered(OrderState):
    name = "delivered"


class Cancelled(OrderState):
    name = "cancelled"


class Order:                                  # context: delegates to its current state
    def __init__(self, order_id: str) -> None:
        self.order_id = order_id
        self._state: OrderState = Placed()

    @property
    def status(self) -> str:
        return self._state.name

    def ship(self) -> None:
        self._state = self._state.ship()

    def deliver(self) -> None:
        self._state = self._state.deliver()

    def cancel(self) -> None:
        self._state = self._state.cancel()


order = Order("A-101")
order.ship()
print(order.status)
try:
    order.cancel()
except ValueError as e:
    print(e)
order.deliver()
print(order.status)

other = Order("A-102")
other.cancel()
print(other.order_id, other.status)
