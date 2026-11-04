from dataclasses import dataclass


@dataclass(frozen=True)
class ConfigCheckpoint:                   # memento with a label
    label: str
    settings: tuple[tuple[str, str], ...]


class ServiceConfig:                      # originator
    def __init__(self, **settings: str) -> None:
        self._settings = dict(settings)

    def set(self, key: str, value: str) -> None:
        self._settings[key] = value

    def show(self) -> str:
        return ", ".join(f"{k}={v}" for k, v in self._settings.items())

    def checkpoint(self, label: str) -> ConfigCheckpoint:
        return ConfigCheckpoint(label, tuple(self._settings.items()))

    def rollback(self, cp: ConfigCheckpoint) -> None:
        self._settings = dict(cp.settings)


class ReleaseLog:                         # caretaker: named checkpoints
    def __init__(self) -> None:
        self._by_label: dict[str, ConfigCheckpoint] = {}

    def keep(self, cp: ConfigCheckpoint) -> None:
        self._by_label[cp.label] = cp

    def get(self, label: str) -> ConfigCheckpoint:
        return self._by_label[label]

    def labels(self) -> list[str]:
        return list(self._by_label)


config = ServiceConfig(replicas="2", image="api:1.4", timeout_ms="800")
log = ReleaseLog()
log.keep(config.checkpoint("v1.4"))

config.set("image", "api:1.5")
config.set("replicas", "4")
log.keep(config.checkpoint("v1.5"))

config.set("timeout_ms", "50")            # bad hotfix: requests start timing out
print("Live:", config.show())
print("Checkpoints:", log.labels())

config.rollback(log.get("v1.5"))
print("Back to v1.5:", config.show())
config.rollback(log.get("v1.4"))
print("Back to v1.4:", config.show())
