from dataclasses import dataclass, replace


@dataclass(frozen=True)
class HttpRequest:
    url: str
    method: str = "GET"
    body: str | None = None
    timeout_s: float = 10.0

    def __post_init__(self) -> None:
        # the same cross-field check a builder's build() would do
        if self.method == "GET" and self.body is not None:
            raise ValueError("GET requests cannot have a body")


# named arguments with defaults: readable, and no argument mix-ups
base = HttpRequest("https://api.example.com/orders")
post = replace(base, method="POST", body='{"id": 7}', timeout_s=5)  # a changed copy
print(base)
print(post)

try:
    replace(base, body="{}")
except ValueError as error:
    print(f"Rejected: {error}")
