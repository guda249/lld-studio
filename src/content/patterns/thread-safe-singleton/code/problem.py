import threading


class DbPool:
    _instance: "DbPool | None" = None
    created = 0

    def __init__(self) -> None:
        DbPool.created += 1
        self.connections = 10  # imagine opening 10 real database connections here

    @classmethod
    def get(cls, pause: threading.Barrier | None = None) -> "DbPool":
        if cls._instance is None:  # check ...
            if pause is not None:
                pause.wait()  # demo only: a thread switch lands right here, between check and act
            cls._instance = DbPool()  # ... then act: both threads get here
        return cls._instance


race = threading.Barrier(2, timeout=2)
threads = [threading.Thread(target=DbPool.get, args=(race,)) for _ in range(2)]
for t in threads:
    t.start()
for t in threads:
    t.join()

print(f"Pools created: {DbPool.created} (should be 1)")
print(f"Connections opened: {DbPool.created * 10}, and one pool is now lost but still open")
