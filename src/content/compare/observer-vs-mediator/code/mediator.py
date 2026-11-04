from abc import ABC, abstractmethod


class HomeHub(ABC):                           # mediator: devices only know this
    @abstractmethod
    def on_event(self, sender: "Device", event: str) -> None: ...


class Device:                                 # colleague base: one link, to the hub
    def __init__(self, hub: HomeHub) -> None:
        self._hub = hub


class MotionSensor(Device):
    def detect(self) -> None:
        print("Sensor: motion in the hall")
        self._hub.on_event(self, "motion")


class Light(Device):
    def turn_on(self, why: str) -> None:
        print(f"  Light: on ({why})")


class Alarm(Device):
    def ring(self) -> None:
        print("  Alarm: ringing")
        self._hub.on_event(self, "alarm")     # the alarm doesn't know the light exists


class SmartHome(HomeHub):                     # concrete mediator: ALL the rules live here
    def __init__(self) -> None:
        self.away = False
        self.sensor = MotionSensor(self)
        self.light = Light(self)
        self.alarm = Alarm(self)

    def on_event(self, sender: Device, event: str) -> None:
        if event == "motion" and self.away:
            self.alarm.ring()
        elif event == "motion":
            self.light.turn_on("someone is home")
        elif event == "alarm":
            self.light.turn_on("flashing for the alarm")


if __name__ == "__main__":
    home = SmartHome()
    home.sensor.detect()                      # at home: just the light
    home.away = True
    home.sensor.detect()                      # away: alarm, and the alarm asks for the light
