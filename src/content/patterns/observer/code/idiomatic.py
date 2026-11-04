from collections.abc import Callable

Listener = Callable[[str, float], None]


class StockTicker:
    def __init__(self) -> None:
        self._listeners: list[Listener] = []

    def subscribe(self, listener: Listener) -> Callable[[], None]:
        self._listeners.append(listener)
        return lambda: self._listeners.remove(listener)   # call it to unsubscribe

    def set_price(self, symbol: str, price: float) -> None:
        for listener in list(self._listeners):
            listener(symbol, price)


ticker = StockTicker()
seen: list[float] = []
stop_printing = ticker.subscribe(lambda s, p: print(f"{s} -> ₹{p:,.2f}"))
ticker.subscribe(lambda s, p: seen.append(p))

ticker.set_price("TCS", 3_850.0)
stop_printing()                                           # the printer leaves
ticker.set_price("TCS", 3_902.5)
print("Prices seen by the logger:", seen)
