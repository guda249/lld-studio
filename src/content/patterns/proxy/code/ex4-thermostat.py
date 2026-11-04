from abc import ABC, abstractmethod
from collections.abc import Callable


class Thermostat(ABC):
    @abstractmethod
    def set_target(self, celsius: int) -> str: ...

    @abstractmethod
    def reading(self) -> str: ...


class DeviceThermostat(Thermostat):
    """Runs on the device itself, in another building."""

    def __init__(self) -> None:
        self._target = 26

    def set_target(self, celsius: int) -> str:
        self._target = celsius
        return f"target {celsius}°C"

    def reading(self) -> str:
        return f"room 29°C, target {self._target}°C"


def device_server(device: DeviceThermostat) -> Callable[[str], str]:
    """The device side: turns a text message back into a method call."""
    def handle(message: str) -> str:
        command, _, arg = message.partition(":")
        if command == "SET":
            return device.set_target(int(arg))
        return device.reading()
    return handle


class ThermostatProxy(Thermostat):
    """Remote proxy: looks local, but every call becomes a network message."""

    def __init__(self, send: Callable[[str], str]) -> None:
        self._send = send

    def _call(self, message: str) -> str:
        print(f"  -> wire: {message}")
        return self._send(message)

    def set_target(self, celsius: int) -> str:
        return self._call(f"SET:{celsius}")

    def reading(self) -> str:
        return self._call("GET")


network = device_server(DeviceThermostat())      # stands in for MQTT or HTTP
thermostat: Thermostat = ThermostatProxy(network)
print(thermostat.reading())
print(thermostat.set_target(22))
print(thermostat.reading())
