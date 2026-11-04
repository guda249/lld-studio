from abc import ABC, abstractmethod


class Speed(ABC):                             # strategy: one way to run the fan
    @abstractmethod
    def rpm(self) -> int: ...


class Low(Speed):
    def rpm(self) -> int:
        return 600


class High(Speed):
    def rpm(self) -> int:
        return 1200


class Fan:                                    # context: the client hands it a speed
    def __init__(self, speed: Speed) -> None:
        self._speed = speed

    def set_speed(self, speed: Speed) -> None:  # the CLIENT decides when to switch
        self._speed = speed

    def run(self) -> str:
        return f"Fan at {self._speed.rpm()} rpm"


if __name__ == "__main__":
    fan = Fan(Low())
    print(fan.run())
    fan.set_speed(High())                     # the remote control picks a new speed
    print(fan.run())
    fan.set_speed(High())                     # picking the same one again changes nothing
    print(fan.run())
    fan.set_speed(Low())                      # any order the client likes: no fixed cycle
    print(fan.run())
