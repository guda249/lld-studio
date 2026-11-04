class OrderPages:  # pretend paginated API: 3 orders per page
    def __init__(self, total: int, page_size: int) -> None:
        self.total, self.page_size = total, page_size

    def fetch_page(self, page: int) -> list[str]:
        start = page * self.page_size
        return [f"order-{i}" for i in range(start, min(start + self.page_size, self.total))]


api = OrderPages(total=7, page_size=3)

# Caller 1: the invoice job writes the paging loop by hand.
invoiced: list[str] = []
page = 0
batch = api.fetch_page(page)
while batch:
    invoiced += batch
    page += 1
    batch = api.fetch_page(page)
print(f"invoiced: {', '.join(invoiced)}")

# Caller 2: the report copies the same loop again.
count, page = 0, 0
batch = api.fetch_page(page)
while batch:
    count += len(batch)
    page += 1
    batch = api.fetch_page(page)
print(f"report counted {count} orders")
print("Switch the API to cursors and both loops break.")
