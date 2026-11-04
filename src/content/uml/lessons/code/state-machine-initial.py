class Order:
    def __init__(self):
        self.state = "Placed"  # the initial arrow
        self.finished = False

    def _move(self, to: str) -> None:
        if self.finished:  # final: no more changes
            raise RuntimeError(f"order is over ({self.state})")
        self.state, self.finished = to, True

    def deliver(self) -> None:
        self._move("Delivered")

    def cancel(self) -> None:
        self._move("Cancelled")


order = Order()
print(order.state)  # Placed
order.cancel()
try:
    order.deliver()
except RuntimeError as err:
    print(err)  # order is over (Cancelled)
