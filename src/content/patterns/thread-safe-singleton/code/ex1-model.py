import threading


class FraudModel:
    def __init__(self) -> None:
        self.size_mb = 900  # imagine loading 900 MB of model weights here


class ModelLoader:
    """Hands out the one FraudModel. Subclasses differ only in how get() guards creation."""

    def __init__(self) -> None:
        self._model: FraudModel | None = None
        self._lock = threading.Lock()
        self.load_log: list[int] = []  # list.append is atomic, so the count is exact
        self.lock_log: list[int] = []

    def _load(self) -> FraudModel:
        self.load_log.append(1)
        return FraudModel()

    def get(self, pause: threading.Barrier | None = None) -> FraudModel:
        raise NotImplementedError


class NoLockLoader(ModelLoader):
    def get(self, pause: threading.Barrier | None = None) -> FraudModel:
        if self._model is None:
            if pause is not None:
                pause.wait()  # demo only: every thread passes the check before anyone loads
            self._model = self._load()
        return self._model


class AlwaysLockLoader(ModelLoader):
    def get(self, pause: threading.Barrier | None = None) -> FraudModel:
        if pause is not None:
            pause.wait()
        with self._lock:  # safe, but every call pays for the lock, forever
            self.lock_log.append(1)
            if self._model is None:
                self._model = self._load()
            return self._model


class DoubleCheckedLoader(ModelLoader):
    def get(self, pause: threading.Barrier | None = None) -> FraudModel:
        if self._model is None:  # fast path once loaded
            if pause is not None:
                pause.wait()
            with self._lock:
                self.lock_log.append(1)
                if self._model is None:  # check again under the lock
                    self._model = self._load()
        return self._model


def run(loader: ModelLoader, racing: int) -> str:
    pause = threading.Barrier(racing, timeout=2)
    threads = [threading.Thread(target=loader.get, args=(pause,)) for _ in range(racing)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    for _ in range(100):
        loader.get()  # 100 more transactions are scored later
    loads = len(loader.load_log)
    loaded = "loaded once" if loads == 1 else f"loaded {loads} times"
    locks = len(loader.lock_log)
    return f"{loaded}, lock taken {locks} time{'' if locks == 1 else 's'}"


for name, make in [("no lock", NoLockLoader), ("always lock", AlwaysLockLoader), ("double-checked", DoubleCheckedLoader)]:
    for racing in [1, 4]:
        print(f"{name}, {racing} racing: {run(make(), racing)}")
