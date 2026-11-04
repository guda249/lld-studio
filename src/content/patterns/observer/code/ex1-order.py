from abc import ABC, abstractmethod


class OrderListener(ABC):                              # observer
    @abstractmethod
    def on_status(self, order_id: str, status: str) -> None: ...


class Order:                                           # subject
    def __init__(self, order_id: str) -> None:
        self.order_id = order_id
        self.status = "PLACED"
        self._listeners: list[OrderListener] = []

    def subscribe(self, listener: OrderListener) -> None:
        self._listeners.append(listener)

    def move_to(self, status: str) -> None:
        self.status = status
        for listener in list(self._listeners):
            listener.on_status(self.order_id, status)


class CustomerSms(OrderListener):
    def __init__(self, phone: str) -> None:
        self._phone = phone

    def on_status(self, order_id: str, status: str) -> None:
        print(f"SMS to {self._phone}: order {order_id} is {status.lower().replace('_', ' ')}")


class RestaurantScreen(OrderListener):
    def on_status(self, order_id: str, status: str) -> None:
        if status in ("PLACED", "CANCELLED", "PICKED_UP"):
            print(f"Kitchen screen: {order_id} -> {status}")


class DeliveryStats(OrderListener):
    def __init__(self) -> None:
        self.counts: dict[str, int] = {}

    def on_status(self, order_id: str, status: str) -> None:
        self.counts[status] = self.counts.get(status, 0) + 1


stats = DeliveryStats()
order = Order("BLR-4471")
for listener in (CustomerSms("98450xxxxx"), RestaurantScreen(), stats):
    order.subscribe(listener)

for status in ["PREPARING", "PICKED_UP", "DELIVERED"]:
    order.move_to(status)
print("Stats:", stats.counts)
