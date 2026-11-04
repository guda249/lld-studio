from abc import ABC, abstractmethod


class HttpClient(ABC):
    @abstractmethod
    def get(self, url: str) -> str: ...


class BasicHttpClient(HttpClient):
    """The real client. Its first call fails, like a flaky network."""

    def __init__(self) -> None:
        self.calls = 0

    def get(self, url: str) -> str:
        self.calls += 1
        if self.calls == 1:
            raise ConnectionError("network blip")
        return f"<html for {url}>"


class ClientDecorator(HttpClient):
    def __init__(self, inner: HttpClient) -> None:
        self._inner = inner

    def get(self, url: str) -> str:
        return self._inner.get(url)


class LoggingClient(ClientDecorator):
    def get(self, url: str) -> str:
        print(f"LOG   GET {url}")
        return super().get(url)


class CachingClient(ClientDecorator):
    def __init__(self, inner: HttpClient) -> None:
        super().__init__(inner)
        self._cache: dict[str, str] = {}

    def get(self, url: str) -> str:
        if url in self._cache:
            print(f"CACHE hit {url}")
        else:
            self._cache[url] = super().get(url)
        return self._cache[url]


class RetryClient(ClientDecorator):
    def __init__(self, inner: HttpClient, attempts: int = 3) -> None:
        super().__init__(inner)
        self._attempts = attempts

    def get(self, url: str) -> str:
        for attempt in range(1, self._attempts + 1):
            try:
                return super().get(url)
            except ConnectionError as error:
                print(f"RETRY attempt {attempt} failed: {error}")
                if attempt == self._attempts:
                    raise
        raise AssertionError("unreachable")


basic = BasicHttpClient()
client: HttpClient = LoggingClient(CachingClient(RetryClient(basic)))
print(client.get("https://example.com"))
print(client.get("https://example.com"))
print(f"real network calls: {basic.calls}")
