from abc import ABC, abstractmethod


class HttpClient(ABC):
    @abstractmethod
    def get(self, url: str) -> dict[str, float]: ...


class RealHttpClient(HttpClient):
    def get(self, url: str) -> dict[str, float]:
        # a real app would call the network here; this demo stays offline
        raise ConnectionError(f"no network in this demo ({url})")


class FakeHttpClient(HttpClient):
    def __init__(self, temp_c: float) -> None:
        self.temp_c = temp_c
        self.calls: list[str] = []

    def get(self, url: str) -> dict[str, float]:
        self.calls.append(url)
        return {"temp_c": self.temp_c}


class WeatherService:
    def create_client(self) -> HttpClient:  # factory method: production default
        return RealHttpClient()

    def advice(self, city: str) -> str:
        data = self.create_client().get(f"https://weather.example/{city}")
        temp = data["temp_c"]
        tip = "carry water" if temp >= 35 else "enjoy the day"
        return f"{city}: {temp:.0f}°C, {tip}"


class FakeWeatherService(WeatherService):
    def __init__(self, fake: FakeHttpClient) -> None:
        self.fake = fake

    def create_client(self) -> HttpClient:  # the test swaps only the creation step
        return self.fake


fake = FakeHttpClient(temp_c=41)
print(FakeWeatherService(fake).advice("Nagpur"))
print(f"Fake client saw: {fake.calls}")
try:
    WeatherService().advice("Nagpur")
except ConnectionError as error:
    print(f"Production client: {error}")
