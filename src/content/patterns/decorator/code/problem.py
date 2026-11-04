class BasicHttpClient:
    def get(self, url: str) -> str:
        return f"<html for {url}>"


class LoggingClient(BasicHttpClient):
    def get(self, url: str) -> str:
        print(f"LOG  GET {url}")
        return super().get(url)


class CachingClient(BasicHttpClient):
    def __init__(self) -> None:
        self._cache: dict[str, str] = {}

    def get(self, url: str) -> str:
        if url not in self._cache:
            self._cache[url] = super().get(url)
        return self._cache[url]


class LoggingCachingClient(CachingClient):
    # Copy-paste of the logging code. Adding retries needs four more classes.
    def get(self, url: str) -> str:
        print(f"LOG  GET {url}")
        return super().get(url)


client = LoggingCachingClient()
print(client.get("https://example.com"))
features = 3
print(f"{features} optional features need {2 ** features} classes to cover every combination")
