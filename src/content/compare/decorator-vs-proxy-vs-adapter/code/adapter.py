from abc import ABC, abstractmethod


class WeatherService(ABC):                    # target: what our app expects (Celsius, by city)
    @abstractmethod
    def temperature(self, city: str) -> float: ...


class FahrenheitFeed:                         # adaptee: an old library we can't change
    READINGS = {"LFPG": 65.23, "ENGM": 44.82, "EGLL": 59.0}

    def read_f(self, station_code: str) -> float:
        return self.READINGS[station_code]


class FahrenheitAdapter(WeatherService):      # adapter: same target, different thing inside
    CODES = {"Paris": "LFPG", "Oslo": "ENGM", "London": "EGLL"}

    def __init__(self, feed: FahrenheitFeed) -> None:
        self._feed = feed

    def temperature(self, city: str) -> float:
        fahrenheit = self._feed.read_f(self.CODES[city])     # city -> station code
        return round((fahrenheit - 32) * 5 / 9, 1)           # Fahrenheit -> Celsius


class WeatherApp:                             # client: only knows WeatherService
    def __init__(self, service: WeatherService) -> None:
        self._service = service

    def report(self, city: str) -> str:
        return f"{city}: {self._service.temperature(city)} C"


if __name__ == "__main__":
    # the wiring happens once, at startup; WeatherApp never sees FahrenheitFeed
    app = WeatherApp(FahrenheitAdapter(FahrenheitFeed()))
    print(app.report("Paris"))
    print(app.report("Oslo"))
    print(app.report("London"))
