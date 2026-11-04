from abc import ABC, abstractmethod


class Bulb(ABC):  # implementation side: how a bulb is actually told what to do
    @abstractmethod
    def set_level(self, percent: int) -> str: ...


class WifiBulb(Bulb):
    def __init__(self, ip: str) -> None:
        self.ip = ip

    def set_level(self, percent: int) -> str:
        return f"HTTP PUT {self.ip}/level={percent}"


class ZigbeeBulb(Bulb):
    def __init__(self, address: int) -> None:
        self.address = address

    def set_level(self, percent: int) -> str:
        return f"Zigbee frame 0x{self.address:04X}:{percent * 255 // 100:02X}"


class Switch(ABC):  # abstraction side: what pressing the switch means
    label = "Switch"

    def __init__(self, bulb: Bulb) -> None:
        self.bulb = bulb  # the bridge; can be swapped at runtime
        self.level = 0

    def press(self) -> str:
        self.level = self.next_level()
        return f"{self.label:<6} -> {self.level:3d}%  {self.bulb.set_level(self.level)}"

    @abstractmethod
    def next_level(self) -> int: ...


class ToggleSwitch(Switch):
    label = "Toggle"

    def next_level(self) -> int:
        return 0 if self.level else 100


class DimmerSwitch(Switch):
    label = "Dimmer"
    steps = [0, 30, 70, 100]

    def next_level(self) -> int:
        return self.steps[(self.steps.index(self.level) + 1) % len(self.steps)]


hall = ToggleSwitch(WifiBulb("192.168.1.20"))
print(hall.press())
print(hall.press())

bedroom = DimmerSwitch(ZigbeeBulb(0x1A2B))
for _ in range(3):
    print(bedroom.press())

bedroom.bulb = WifiBulb("192.168.1.31")  # replaced the bulb; the switch logic is untouched
print(bedroom.press())
