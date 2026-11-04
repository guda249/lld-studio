from abc import ABC, abstractmethod


class SensorObserver(ABC):                             # observer (pull model)
    @abstractmethod
    def refresh(self, sensor: "TemperatureSensor") -> None: ...


class TemperatureSensor:                               # subject
    def __init__(self, room: str) -> None:
        self.room = room
        self.celsius = 0.0
        self._observers: list[SensorObserver] = []

    def attach(self, observer: SensorObserver) -> None:
        self._observers.append(observer)

    def reading(self, celsius: float) -> None:
        if celsius == self.celsius:
            return                                     # no change, no noise
        self.celsius = celsius
        for observer in list(self._observers):
            observer.refresh(self)                     # observers pull what they need


class AirConditioner(SensorObserver):
    def __init__(self, switch_on_at: float) -> None:
        self._switch_on_at = switch_on_at
        self.on = False

    def refresh(self, sensor: TemperatureSensor) -> None:
        wanted = sensor.celsius >= self._switch_on_at
        if wanted != self.on:
            self.on = wanted
            print(f"AC in {sensor.room} turned {'ON' if wanted else 'OFF'} at {sensor.celsius}°C")


class AppTile(SensorObserver):
    def refresh(self, sensor: TemperatureSensor) -> None:
        print(f"  app tile: {sensor.room} {sensor.celsius}°C")


sensor = TemperatureSensor("Bedroom")
sensor.attach(AirConditioner(switch_on_at=28.0))
sensor.attach(AppTile())
for value in [26.5, 28.5, 28.5, 29.0, 25.0]:
    sensor.reading(value)
