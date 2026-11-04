import threading


class AppConfig:
    _instance: "AppConfig | None" = None
    _lock = threading.Lock()
    _settings: dict[str, str]
    loads = 0

    def __new__(cls) -> "AppConfig":
        if cls._instance is None:  # fast path, no lock
            with cls._lock:
                if cls._instance is None:  # double-checked locking
                    instance = super().__new__(cls)
                    instance._settings = {"env": "prod", "region": "ap-south-1"}
                    AppConfig.loads += 1
                    cls._instance = instance
        return cls._instance

    def get(self, key: str) -> str:
        return self._settings[key]


class ReportService:
    def header(self) -> str:
        config = AppConfig()
        return f"Report for {config.get('env')} in {config.get('region')}"


seen: list[int] = []
threads = [threading.Thread(target=lambda: seen.append(id(AppConfig()))) for _ in range(8)]
for t in threads:
    t.start()
for t in threads:
    t.join()

print(f"8 threads asked for AppConfig, distinct objects: {len(set(seen))}")
print(f"Settings loaded {AppConfig.loads} time(s)")
print(f"Same instance: {AppConfig() is AppConfig()}")
print(ReportService().header())
