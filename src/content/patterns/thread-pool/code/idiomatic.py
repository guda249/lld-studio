from concurrent.futures import ThreadPoolExecutor, as_completed

# The standard library already has a thread pool: ThreadPoolExecutor.
# "with" shuts it down for you (waits for every task, then stops the workers).
# Threads suit I/O work (network, disk). For CPU-heavy work in Python, the GIL lets
# only one thread run Python code at a time: use ProcessPoolExecutor instead.


def make_invoice(order_id: int) -> str:
    if order_id == 7:
        raise ValueError("order 7 has no address")
    return f"invoice-{order_id}.pdf"


with ThreadPoolExecutor(max_workers=3, thread_name_prefix="invoice") as pool:
    futures = {pool.submit(make_invoice, oid): oid for oid in range(1, 11)}
    ready: list[str] = []
    failed: list[str] = []
    for future in as_completed(futures):        # results arrive as tasks finish
        try:
            ready.append(future.result())
        except ValueError as err:
            failed.append(str(err))

    squares = list(pool.map(lambda n: n * n, range(5)))   # map keeps input order

print(f"Invoices ready: {len(ready)}")
print(f"First three (sorted): {sorted(ready, key=lambda s: int(s[8:-4]))[:3]}")
print(f"Failed: {failed}")
print(f"pool.map keeps order: {squares}")
