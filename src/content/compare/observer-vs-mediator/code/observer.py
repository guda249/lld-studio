from abc import ABC, abstractmethod


class MotionListener(ABC):                    # observer: anything that wants to hear about motion
    @abstractmethod
    def on_motion(self, room: str) -> None: ...


class MotionSensor:                           # subject: knows a list, not who is on it
    def __init__(self, room: str) -> None:
        self._room = room
        self._listeners: list[MotionListener] = []

    def subscribe(self, listener: MotionListener) -> None:
        self._listeners.append(listener)

    def unsubscribe(self, listener: MotionListener) -> None:
        self._listeners.remove(listener)

    def detect(self) -> None:
        print(f"Sensor: motion in the {self._room}")
        for listener in self._listeners:      # same message to everyone, no rules
            listener.on_motion(self._room)


class Light(MotionListener):
    def on_motion(self, room: str) -> None:
        print(f"  Light: on in the {room}")


class Alarm(MotionListener):
    def on_motion(self, room: str) -> None:
        print(f"  Alarm: ringing, motion in the {room}")


if __name__ == "__main__":
    sensor = MotionSensor("hall")
    light, alarm = Light(), Alarm()
    sensor.subscribe(light)
    sensor.subscribe(alarm)                   # we left home: the alarm listens too
    sensor.detect()
    sensor.unsubscribe(alarm)                 # back home: the alarm stops listening
    sensor.detect()
