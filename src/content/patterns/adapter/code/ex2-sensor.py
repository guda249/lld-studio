from abc import ABC, abstractmethod


class TemperatureSensor(ABC):  # target: the cold-chain dashboard works in Celsius
    @abstractmethod
    def sensor_id(self) -> str: ...

    @abstractmethod
    def celsius(self) -> float: ...


class LegacyFahrenheitProbe:  # adaptee: firmware from an imported cold-storage unit
    def __init__(self, serial: str, reading_f: float) -> None:
        self.serial = serial
        self._reading_f = reading_f

    def read_f(self) -> float:
        return self._reading_f


class ProbeAdapter(LegacyFahrenheitProbe, TemperatureSensor):  # class adapter: inherits both
    def sensor_id(self) -> str:
        return f"probe-{self.serial}"

    def celsius(self) -> float:
        return round((self.read_f() - 32) * 5 / 9, 1)


class NativeSensor(TemperatureSensor):  # a newer sensor that already fits
    def __init__(self, name: str, value_c: float) -> None:
        self._name = name
        self._value_c = value_c

    def sensor_id(self) -> str:
        return self._name

    def celsius(self) -> float:
        return self._value_c


def check_cold_room(sensors: list[TemperatureSensor], max_c: float) -> None:
    for s in sensors:
        status = "OK" if s.celsius() <= max_c else "ALERT"
        print(f"{s.sensor_id():<12} {s.celsius():5.1f} °C  {status}")


vaccine_room = [NativeSensor("rack-A", 3.5), ProbeAdapter("F102", 39.2), ProbeAdapter("F207", 46.4)]
check_cold_room(vaccine_room, max_c=5.0)
print(f"Adapter is still a probe too: raw reading {vaccine_room[2].read_f()} °F")
