class Counter:
    """One Counter per metric name (a 'multiton'), like logging.getLogger(name)."""

    _registry: dict[str, "Counter"] = {}

    def __init__(self, name: str) -> None:
        self.name = name
        self.value = 0

    @classmethod
    def named(cls, name: str) -> "Counter":
        if name not in cls._registry:
            cls._registry[name] = cls(name)
        return cls._registry[name]

    @classmethod
    def report(cls) -> str:
        return ", ".join(f"{name}={c.value}" for name, c in cls._registry.items())

    def inc(self, by: int = 1) -> None:
        self.value += by


# Two "modules" that never import each other still update the same counters.
def handle_login(ok: bool) -> None:
    Counter.named("http_requests").inc()
    if not ok:
        Counter.named("login_failures").inc()


def handle_search(results: int) -> None:
    Counter.named("http_requests").inc()
    Counter.named("search_results").inc(results)


handle_login(True)
handle_login(False)
handle_search(12)
handle_search(0)

print(f"Same counter object: {Counter.named('http_requests') is Counter.named('http_requests')}")
print(f"Metrics: {Counter.report()}")
