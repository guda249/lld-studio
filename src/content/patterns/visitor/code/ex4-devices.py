from abc import ABC, abstractmethod
from dataclasses import dataclass


class DeviceVisitor[T](ABC):
    @abstractmethod
    def visit_thermostat(self, device: "Thermostat") -> T: ...

    @abstractmethod
    def visit_camera(self, device: "Camera") -> T: ...

    @abstractmethod
    def visit_door_lock(self, device: "DoorLock") -> T: ...


class Device(ABC):
    name: str

    @abstractmethod
    def accept[T](self, visitor: DeviceVisitor[T]) -> T: ...


@dataclass
class Thermostat(Device):
    name: str
    target_c: int
    hours_on: float

    def accept[T](self, visitor: DeviceVisitor[T]) -> T:
        return visitor.visit_thermostat(self)


@dataclass
class Camera(Device):
    name: str
    resolution: str
    free_storage_gb: int

    def accept[T](self, visitor: DeviceVisitor[T]) -> T:
        return visitor.visit_camera(self)


@dataclass
class DoorLock(Device):
    name: str
    battery_pct: int

    def accept[T](self, visitor: DeviceVisitor[T]) -> T:
        return visitor.visit_door_lock(self)


class EnergyVisitor(DeviceVisitor[float]):   # kWh per day, sample figures
    def visit_thermostat(self, device: Thermostat) -> float: return 1.2 * device.hours_on
    def visit_camera(self, device: Camera) -> float: return 0.48 if device.resolution == "4K" else 0.24
    def visit_door_lock(self, device: DoorLock) -> float: return 0.01


class HealthCheckVisitor(DeviceVisitor[str]):
    def visit_thermostat(self, device: Thermostat) -> str:
        return "OK" if 16 <= device.target_c <= 30 else "check target temperature"

    def visit_camera(self, device: Camera) -> str:
        return "storage low" if device.free_storage_gb < 5 else "OK"

    def visit_door_lock(self, device: DoorLock) -> str:
        return "replace battery" if device.battery_pct < 20 else "OK"


home: list[Device] = [
    Thermostat("Bedroom AC", 24, 6.0),
    Camera("Gate camera", "4K", 3),
    DoorLock("Front door", 15),
]
for device in home:
    print(f"{device.name:<12} {device.accept(EnergyVisitor()):5.2f} kWh/day  {device.accept(HealthCheckVisitor())}")
print(f"total: {sum(d.accept(EnergyVisitor()) for d in home):.2f} kWh/day")
