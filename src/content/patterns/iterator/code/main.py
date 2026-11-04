class OrderPages:  # aggregate: a pretend paginated API
    def __init__(self, total: int, page_size: int) -> None:
        self.total, self.page_size = total, page_size

    def fetch_page(self, page: int) -> list[str]:
        print(f"  (fetching page {page})")
        start = page * self.page_size
        end = min(start + self.page_size, self.total)
        return [f"order-{i}" for i in range(start, end)]

    def __iter__(self) -> "OrderIterator":
        return OrderIterator(self)  # every loop gets a fresh iterator


class OrderIterator:  # concrete iterator: remembers the page and a small buffer
    def __init__(self, api: OrderPages) -> None:
        self._api = api
        self._page = 0
        self._buffer: list[str] = []
        self._done = False  # set after an empty page, so we stop calling the API

    def __iter__(self) -> "OrderIterator":
        return self

    def __next__(self) -> str:
        if not self._buffer and not self._done:
            self._buffer = self._api.fetch_page(self._page)
            self._page += 1
            self._done = not self._buffer
        if not self._buffer:
            raise StopIteration
        return self._buffer.pop(0)


pages = OrderPages(total=7, page_size=3)
for order in pages:  # the caller sees a plain loop, no paging code
    print(order)

print("first two only:")
it = iter(pages)
print(next(it), next(it))  # only page 0 is fetched
