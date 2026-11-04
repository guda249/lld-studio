import threading


class RegionClient:
    """An HTTP client for one cloud region: opens a connection pool and fetches credentials."""

    def __init__(self, region: str) -> None:
        self.region = region


class RacyRegistry:
    """One client per region (a multiton), created lazily, with no lock."""

    def __init__(self) -> None:
        self._clients: dict[str, RegionClient] = {}
        self.created: list[str] = []

    def client(self, region: str, pause: threading.Barrier) -> RegionClient:
        if region not in self._clients:
            pause.wait()  # demo only: every request passes the check before anyone creates
            self.created.append(region)
            self._clients[region] = RegionClient(region)
        return self._clients[region]


class SafeRegistry:
    """Same idea, but the check and the create happen together under one lock."""

    def __init__(self) -> None:
        self._clients: dict[str, RegionClient] = {}
        self._lock = threading.Lock()
        self.created: list[str] = []

    def client(self, region: str, pause: threading.Barrier) -> RegionClient:
        pause.wait()
        with self._lock:
            if region not in self._clients:
                self.created.append(region)
                self._clients[region] = RegionClient(region)
            return self._clients[region]


def run(registry: RacyRegistry | SafeRegistry, regions: list[str]) -> str:
    pause = threading.Barrier(len(regions), timeout=2)
    threads = [threading.Thread(target=registry.client, args=(r, pause)) for r in regions]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    clients, distinct = len(registry.created), len(set(registry.created))
    return f"{clients} client{'' if clients == 1 else 's'} for {distinct} region{'' if distinct == 1 else 's'}"


requests = {"4 × Mumbai": ["ap-south-1"] * 4, "2 × Mumbai, 2 × Frankfurt": ["ap-south-1", "ap-south-1", "eu-central-1", "eu-central-1"]}
for label, regions in requests.items():
    for name, make in [("racy", RacyRegistry), ("safe", SafeRegistry)]:
        print(f"{label}, {name}: {run(make(), regions)}")
