from abc import ABC, abstractmethod


class Light(ABC):
    @abstractmethod
    def turn_on(self, room: str) -> str: ...


class Lock(ABC):
    @abstractmethod
    def lock(self, door: str) -> str: ...


class ZigbeeLight(Light):
    def turn_on(self, room: str) -> str:
        return f"[zigbee] light on in {room}"


class ZigbeeLock(Lock):
    def lock(self, door: str) -> str:
        return f"[zigbee] {door} locked"


class WifiLight(Light):
    def turn_on(self, room: str) -> str:
        return f"[wifi] light on in {room}"


class WifiLock(Lock):
    def lock(self, door: str) -> str:
        return f"[wifi] {door} locked"


class DeviceFactory(ABC):
    @abstractmethod
    def create_light(self) -> Light: ...

    @abstractmethod
    def create_lock(self) -> Lock: ...


class ZigbeeFactory(DeviceFactory):
    def create_light(self) -> Light:
        return ZigbeeLight()

    def create_lock(self) -> Lock:
        return ZigbeeLock()


class WifiFactory(DeviceFactory):
    def create_light(self) -> Light:
        return WifiLight()

    def create_lock(self) -> Lock:
        return WifiLock()


class HomeHub:
    def __init__(self, devices: DeviceFactory) -> None:
        self.devices = devices

    def evening(self) -> list[str]:
        light = self.devices.create_light()
        lock = self.devices.create_lock()
        return [light.turn_on("living room"), lock.lock("front door")]


if __name__ == "__main__":
    for factory in (ZigbeeFactory(), WifiFactory()):
        for line in HomeHub(factory).evening():
            print(line)
