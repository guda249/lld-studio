import threading

log: list[str] = []


class PincodeDirectory:
    """19,000 pincodes and their cities: slow to build, then read-only."""

    def __init__(self) -> None:
        log.append("load")
        self._cities = {"560001": "Bengaluru", "110001": "New Delhi"}

    def city(self, pincode: str) -> str:
        return self._cities[pincode]


class EagerServices:
    def __init__(self) -> None:
        self.directory = PincodeDirectory()  # built at startup, whether or not anyone needs it


class LazyServices:
    def __init__(self) -> None:
        self._directory: PincodeDirectory | None = None
        self._lock = threading.Lock()

    @property
    def directory(self) -> PincodeDirectory:  # built on first use, exactly once
        if self._directory is None:
            with self._lock:
                if self._directory is None:
                    self._directory = PincodeDirectory()
        return self._directory


def run(services_type: type[EagerServices] | type[LazyServices], used: bool) -> str:
    log.clear()
    services = services_type()
    log.append("ready")
    if used:
        threads = [threading.Thread(target=lambda: services.directory.city("560001")) for _ in range(4)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
    loads = log.count("load")
    if loads == 0:
        return "never loaded"
    when = "at startup" if log.index("load") < log.index("ready") else "on first use"
    return f"loaded {when}, {loads} time" + ("" if used else ", never used")


for name, services_type in [("eager", EagerServices), ("lazy", LazyServices)]:
    for used in [True, False]:
        label = "4 parcels routed" if used else "no parcels today"
        print(f"{name}, {label}: {run(services_type, used)}")
