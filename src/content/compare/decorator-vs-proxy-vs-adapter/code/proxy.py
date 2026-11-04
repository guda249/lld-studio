from abc import ABC, abstractmethod


class WeatherService(ABC):                    # subject: what every client calls
    @abstractmethod
    def temperature(self, city: str) -> float: ...


class StationWeather(WeatherService):         # the real service: slow, so we count the calls
    READINGS = {"Paris": 18.46, "Oslo": 7.12}

    def temperature(self, city: str) -> float:
        print(f"  asking the station about {city}...")
        return self.READINGS[city]


class CachingWeather(WeatherService):         # proxy: same interface, decides IF the real one is called
    def __init__(self, real: WeatherService) -> None:
        self._real = real
        self._cache: dict[str, float] = {}

    def temperature(self, city: str) -> float:
        if city not in self._cache:
            self._cache[city] = self._real.temperature(city)
        return self._cache[city]


def show(service: WeatherService, city: str) -> None:   # the client can't tell the difference
    print(f"{city}: {service.temperature(city)}")


if __name__ == "__main__":
    service = CachingWeather(StationWeather())
    show(service, "Paris")
    show(service, "Paris")                    # answered from the cache: no station call
    show(service, "Oslo")
