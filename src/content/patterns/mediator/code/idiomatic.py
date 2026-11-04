from collections import defaultdict
from typing import Callable

Handler = Callable[[str], None]


class EventBus:  # a generic mediator: senders and listeners share only topic names
    def __init__(self) -> None:
        self._subs: dict[str, list[Handler]] = defaultdict(list)

    def subscribe(self, topic: str, handler: Handler) -> None:
        self._subs[topic].append(handler)

    def publish(self, topic: str, payload: str) -> None:
        for handler in self._subs.get(topic, []):
            handler(payload)


bus = EventBus()
bus.subscribe("order.placed", lambda p: print(f"inventory: reserve stock for {p}"))
bus.subscribe("order.placed", lambda p: print(f"email: confirmation for {p}"))
bus.subscribe("order.cancelled", lambda p: print(f"payments: refund {p}"))

bus.publish("order.placed", "order #1042")
bus.publish("order.cancelled", "order #1042")
bus.publish("order.shipped", "order #1042")  # nobody listens, nothing happens
print("done")
