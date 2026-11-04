from abc import ABC, abstractmethod


class Observer(ABC):
    @abstractmethod
    def update(self, symbol: str, price: float) -> None: ...


class StockTicker:                                    # subject / publisher
    def __init__(self) -> None:
        self._observers: list[Observer] = []
        self._prices: dict[str, float] = {}

    def subscribe(self, observer: Observer) -> None:
        self._observers.append(observer)

    def unsubscribe(self, observer: Observer) -> None:
        self._observers.remove(observer)

    def set_price(self, symbol: str, price: float) -> None:
        self._prices[symbol] = price
        self._notify_subscribers(symbol, price)

    def _notify_subscribers(self, symbol: str, price: float) -> None:
        for observer in list(self._observers):        # copy: an observer may unsubscribe mid-loop
            observer.update(symbol, price)


class PriceDisplay(Observer):
    def update(self, symbol: str, price: float) -> None:
        print(f"{symbol}: ₹{price:,.2f}")


class PriceAlert(Observer):
    def __init__(self, symbol: str, threshold: float) -> None:
        self._symbol, self._threshold = symbol, threshold
        self.triggered: list[str] = []

    def update(self, symbol: str, price: float) -> None:
        if symbol == self._symbol and price >= self._threshold:
            self.triggered.append(f"{symbol} crossed ₹{self._threshold:,.0f} at ₹{price:,.2f}")


ticker = StockTicker()
display = PriceDisplay()
alert = PriceAlert("INFY", 1_900)
ticker.subscribe(display)
ticker.subscribe(alert)

ticker.set_price("INFY", 1_875.50)
ticker.set_price("INFY", 1_912.00)
ticker.unsubscribe(display)
ticker.set_price("INFY", 1_930.25)                    # only the alert hears this one
print(alert.triggered)
