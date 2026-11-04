from abc import ABC, abstractmethod


class Light:  # receiver
    def __init__(self, room: str) -> None:
        self.room, self.on = room, False

    def switch(self, on: bool) -> None:
        self.on = on
        print(f"  {self.room} light {'ON' if on else 'OFF'}")


class Fan:  # receiver
    def __init__(self, room: str) -> None:
        self.room, self.speed = room, 0

    def set_speed(self, speed: int) -> None:
        self.speed = speed
        print(f"  {self.room} fan speed {speed}")


class Command(ABC):
    @abstractmethod
    def execute(self) -> None: ...

    @abstractmethod
    def undo(self) -> None: ...


class LightOn(Command):
    def __init__(self, light: Light) -> None:
        self._light = light

    def execute(self) -> None:
        self._light.switch(True)

    def undo(self) -> None:
        self._light.switch(False)


class FanSpeed(Command):
    def __init__(self, fan: Fan, speed: int) -> None:
        self._fan, self._speed = fan, speed
        self._previous: list[int] = []  # a stack, so pressing twice still undoes correctly

    def execute(self) -> None:
        self._previous.append(self._fan.speed)
        self._fan.set_speed(self._speed)

    def undo(self) -> None:
        self._fan.set_speed(self._previous.pop())


class RemoteControl:  # invoker
    def __init__(self) -> None:
        self._slots: dict[str, Command] = {}
        self._history: list[Command] = []

    def assign(self, button: str, command: Command) -> None:
        self._slots[button] = command

    def press(self, button: str) -> None:
        print(f"[{button}]")
        command = self._slots[button]
        command.execute()
        self._history.append(command)

    def press_undo(self) -> None:
        print("[undo]")
        if self._history:
            self._history.pop().undo()
        else:
            print("  nothing to undo")


light, fan = Light("Bedroom"), Fan("Bedroom")
remote = RemoteControl()
remote.assign("1", LightOn(light))
remote.assign("2", FanSpeed(fan, 3))
remote.assign("3", FanSpeed(fan, 5))

remote.press("1")
remote.press("2")
remote.press("3")
remote.press_undo()
remote.press_undo()
remote.press_undo()
remote.press_undo()
