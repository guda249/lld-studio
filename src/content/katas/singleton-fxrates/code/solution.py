import threading


class ExchangeRates:
    _instance: "ExchangeRates | None" = None
    _lock = threading.Lock()
    _rates: dict[str, float]

    def __new__(cls) -> "ExchangeRates":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:  # checked again inside the lock
                    instance = super().__new__(cls)
                    # the slow download now happens once
                    instance._rates = {"EUR": 0.92, "GBP": 0.79, "INR": 83.1}
                    cls._instance = instance
        return cls._instance

    def convert(self, usd: float, currency: str) -> float:
        return round(usd * self._rates[currency], 2)


class HotelPricing:
    def price(self, usd: float, currency: str) -> str:
        rates = ExchangeRates()  # always the same shared object
        return f"Hotel: {rates.convert(usd, currency)} {currency}"


class FlightPricing:
    def price(self, usd: float, currency: str) -> str:
        rates = ExchangeRates()
        return f"Flight: {rates.convert(usd, currency)} {currency}"


if __name__ == "__main__":
    hotels = HotelPricing()
    flights = FlightPricing()
    print(hotels.price(120.0, "EUR"))
    print(flights.price(300.0, "INR"))
    print(hotels.price(80.0, "GBP"))
