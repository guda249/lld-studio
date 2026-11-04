from collections.abc import Iterator


def fetch_page(page: int, total: int = 7, size: int = 3) -> list[str]:
    start = page * size
    return [f"order-{i}" for i in range(start, min(start + size, total))]


# A generator function IS an iterator: yield keeps the position for you.
def all_orders() -> Iterator[str]:
    page = 0
    while batch := fetch_page(page):
        yield from batch
        page += 1


print(list(all_orders()))
# Lazy: stops fetching pages as soon as the first match is found.
print(next(o for o in all_orders() if o.endswith("4")))
