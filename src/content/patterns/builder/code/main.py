from dataclasses import dataclass


@dataclass(frozen=True)
class HttpRequest:
    method: str
    url: str
    headers: tuple[tuple[str, str], ...]  # a tuple keeps the product immutable
    body: str | None
    timeout_s: float


class HttpRequestBuilder:
    def __init__(self, url: str) -> None:
        self._url = url
        self._method = "GET"
        self._headers: dict[str, str] = {}
        self._body: str | None = None
        self._timeout_s = 10.0

    def method(self, method: str) -> "HttpRequestBuilder":
        self._method = method.upper()
        return self

    def header(self, key: str, value: str) -> "HttpRequestBuilder":
        self._headers[key] = value
        return self

    def json_body(self, body: str) -> "HttpRequestBuilder":
        self._body = body
        return self.header("Content-Type", "application/json")

    def timeout(self, seconds: float) -> "HttpRequestBuilder":
        self._timeout_s = seconds
        return self

    def build(self) -> HttpRequest:
        # rules that span several fields are checked once, here
        if self._method == "GET" and self._body is not None:
            raise ValueError("GET requests cannot have a body")
        if self._timeout_s <= 0:
            raise ValueError("timeout must be positive")
        return HttpRequest(self._method, self._url, tuple(self._headers.items()),
                           self._body, self._timeout_s)


request = (
    HttpRequestBuilder("https://api.example.com/orders")
    .method("post")
    .json_body('{"id": 7}')
    .timeout(5)
    .build()
)
print(f"{request.method} {request.url} timeout={request.timeout_s}s")
print(f"headers={dict(request.headers)} body={request.body}")

try:
    HttpRequestBuilder("https://api.example.com/orders").json_body("{}").build()
except ValueError as error:
    print(f"Rejected: {error}")
