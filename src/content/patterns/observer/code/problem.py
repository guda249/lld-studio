class PriceDisplay:
    def show(self, symbol: str, price: float) -> None:
        print(f"Display  {symbol}: ₹{price:,.2f}")


class PriceAlert:
    def check(self, symbol: str, price: float) -> None:
        if price >= 1_900:
            print(f"Alert    {symbol} crossed ₹1,900")


class StockTicker:
    def __init__(self) -> None:
        self.prices: dict[str, float] = {}
        self.display = PriceDisplay()     # hard-wired consumer
        self.alerts = PriceAlert()        # hard-wired consumer

    def set_price(self, symbol: str, price: float) -> None:
        self.prices[symbol] = price
        self.display.show(symbol, price)
        self.alerts.check(symbol, price)
        # a mobile push service? edit this class again


ticker = StockTicker()
ticker.set_price("INFY", 1_875.50)
ticker.set_price("INFY", 1_912.00)
print("The ticker knows every consumer by name.")
