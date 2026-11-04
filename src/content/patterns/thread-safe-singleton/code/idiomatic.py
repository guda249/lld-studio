import threading


class DbPool:
    created = 0

    def __init__(self) -> None:
        DbPool.created += 1
        self.connections = 10


# In a real project this line lives in db.py. Python runs a module's code once, under the
# import lock, so every `from db import pool` in every thread gets this same object.
# No class attribute, no __new__, no double check. The cost: it is created at import, even if unused.
pool = DbPool()


def handle_request(seen: list[DbPool]) -> None:
    seen.append(pool)  # stands in for `from db import pool`


seen: list[DbPool] = []
threads = [threading.Thread(target=handle_request, args=(seen,)) for _ in range(8)]
for t in threads:
    t.start()
for t in threads:
    t.join()

print(f"8 request threads, distinct pools: {len({id(p) for p in seen})}")
print(f"Pools created: {DbPool.created}")
