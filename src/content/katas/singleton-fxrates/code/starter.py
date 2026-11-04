class ExchangeRates:
    def __init__(self) -> None:
        # pretend this is a slow download from the bank's rate feed
        self._rates = {"EUR": 0.92, "GBP": 0.79, "INR": 83.1}

    def convert(self, usd: float, currency: str) -> float:
        return round(usd * self._rates[currency], 2)


class HotelPricing:
    def price(self, usd: float, currency: str) -> str:
        rates = ExchangeRates()  # downloads the rates again
        return f"Hotel: {rates.convert(usd, currency)} {currency}"


class FlightPricing:
    def price(self, usd: float, currency: str) -> str:
        rates = ExchangeRates()  # and again: the two may even disagree
        return f"Flight: {rates.convert(usd, currency)} {currency}"


if __name__ == "__main__":
    hotels = HotelPricing()
    flights = FlightPricing()
    print(hotels.price(120.0, "EUR"))
    print(flights.price(300.0, "INR"))
    print(hotels.price(80.0, "GBP"))
