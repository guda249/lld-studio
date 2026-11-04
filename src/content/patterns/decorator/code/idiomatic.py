from collections.abc import Callable

# The "component" is just a function type: url in, page out.
Fetch = Callable[[str], str]


def basic_fetch(url: str) -> str:
    return f"<html for {url}>"


def with_logging(inner: Fetch) -> Fetch:
    def fetch(url: str) -> str:
        print(f"LOG   GET {url}")
        return inner(url)
    return fetch


def with_cache(inner: Fetch) -> Fetch:
    cache: dict[str, str] = {}

    def fetch(url: str) -> str:
        if url not in cache:
            cache[url] = inner(url)
        return cache[url]
    return fetch


# Still the Decorator pattern: we wrap a value at runtime and keep its shape.
fetch = with_logging(with_cache(basic_fetch))
print(fetch("https://example.com"))
print(fetch("https://example.com"))
