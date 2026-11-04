class HttpRequest:
    def __init__(self, method: str, url: str, headers: dict[str, str], body: str | None,
                 timeout_s: float, follow_redirects: bool, proxy: str | None, retries: int) -> None:
        self.method = method
        self.url = url
        self.headers = headers
        self.body = body
        self.timeout_s = timeout_s
        self.follow_redirects = follow_redirects
        self.proxy = proxy
        self.retries = retries


# eight positional arguments: which number is the timeout and which the retries?
ok = HttpRequest("POST", "https://api.example.com/orders",
                 {"Content-Type": "application/json"}, '{"id": 7}', 5.0, True, None, 3)
# timeout and retries swapped by mistake, and a GET with a body: nothing checks either
bad = HttpRequest("GET", "https://api.example.com/orders", {}, '{"id": 7}', 3, True, None, 5)

for r in (ok, bad):
    print(f"{r.method} timeout={r.timeout_s}s retries={r.retries} body={r.body}")
