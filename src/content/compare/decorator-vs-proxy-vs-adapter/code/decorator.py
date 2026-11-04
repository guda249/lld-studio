from abc import ABC, abstractmethod


class WeatherService(ABC):                    # component: what every client calls
    @abstractmethod
    def temperature(self, city: str) -> float: ...


class StationWeather(WeatherService):         # the real service
    READINGS = {"Paris": 18.46, "Oslo": 7.12}

    def temperature(self, city: str) -> float:
        return self.READINGS[city]


class Rounded(WeatherService):                # decorator: adds rounding
    def __init__(self, inner: WeatherService) -> None:
        self._inner = inner

    def temperature(self, city: str) -> float:
        return round(self._inner.temperature(city), 1)


class Logged(WeatherService):                 # decorator: adds a log line
    def __init__(self, inner: WeatherService) -> None:
        self._inner = inner

    def temperature(self, city: str) -> float:
        value = self._inner.temperature(city)
        print(f"  log: {city} -> {value}")
        return value


if __name__ == "__main__":
    # the client stacks the extras it wants, in the order it wants
    service: WeatherService = Logged(Rounded(StationWeather()))
    print(service.temperature("Paris"))
    service = Rounded(Logged(StationWeather()))   # other order: the log sees the raw value
    print(service.temperature("Oslo"))
    service = StationWeather()                # no extras at all: same interface
    print(service.temperature("Oslo"))
