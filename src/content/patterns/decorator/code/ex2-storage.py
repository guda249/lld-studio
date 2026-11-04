import base64
from abc import ABC, abstractmethod


class DataStore(ABC):
    @abstractmethod
    def write(self, data: str) -> None: ...

    @abstractmethod
    def read(self) -> str: ...


class MemoryStore(DataStore):
    """Stands in for a file or a database column."""

    def __init__(self) -> None:
        self.raw = ""

    def write(self, data: str) -> None:
        self.raw = data

    def read(self) -> str:
        return self.raw


class StoreDecorator(DataStore):
    def __init__(self, inner: DataStore) -> None:
        self._inner = inner

    def write(self, data: str) -> None:
        self._inner.write(data)

    def read(self) -> str:
        return self._inner.read()


class Base64Layer(StoreDecorator):
    def write(self, data: str) -> None:
        super().write(base64.b64encode(data.encode()).decode())

    def read(self) -> str:
        return base64.b64decode(super().read()).decode()


class ReverseLayer(StoreDecorator):
    """A toy scrambler. A real app would encrypt here."""

    def write(self, data: str) -> None:
        super().write(data[::-1])

    def read(self) -> str:
        return super().read()[::-1]


secret = "db_password=s3cret"
disk_a, disk_b = MemoryStore(), MemoryStore()
store_a = ReverseLayer(Base64Layer(disk_a))
store_b = Base64Layer(ReverseLayer(disk_b))
store_a.write(secret)
store_b.write(secret)
print("A raw :", disk_a.raw)
print("B raw :", disk_b.raw)
print("A read:", store_a.read())
print("B read:", store_b.read())
