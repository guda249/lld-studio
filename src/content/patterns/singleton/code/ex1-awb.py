import threading


class AwbGenerator:
    """One generator per process, so two parcels never get the same airway bill number."""

    _instance: "AwbGenerator | None" = None
    _create_lock = threading.Lock()
    _counter: int
    _next_lock: threading.Lock

    def __new__(cls) -> "AwbGenerator":
        if cls._instance is None:
            with cls._create_lock:
                if cls._instance is None:
                    instance = super().__new__(cls)
                    instance._counter = 0
                    instance._next_lock = threading.Lock()
                    cls._instance = instance
        return cls._instance

    def next_awb(self, hub: str) -> str:
        with self._next_lock:  # many hub workers call this at once
            self._counter += 1
            return f"{hub}-{self._counter:06d}"


issued: list[str] = []


def hub_worker(hub: str) -> None:
    for _ in range(250):
        issued.append(AwbGenerator().next_awb(hub))


workers = [threading.Thread(target=hub_worker, args=(hub,)) for hub in ["BLR", "DEL", "BOM", "HYD"]]
for w in workers:
    w.start()
for w in workers:
    w.join()

print(f"Generated {len(issued)} AWB numbers, {len(set(issued))} unique")
print(f"Next parcel from Chennai gets {AwbGenerator().next_awb('CHE')}")
print(f"Same generator everywhere: {AwbGenerator() is AwbGenerator()}")
