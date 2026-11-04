from abc import ABC, abstractmethod


class FanState(ABC):                          # state: how the fan behaves right now
    @abstractmethod
    def rpm(self) -> int: ...

    @abstractmethod
    def pull(self) -> "FanState": ...         # each state knows what comes next


class Off(FanState):
    def rpm(self) -> int:
        return 0

    def pull(self) -> FanState:
        return Low()


class Low(FanState):
    def rpm(self) -> int:
        return 600

    def pull(self) -> FanState:
        return High()


class High(FanState):
    def rpm(self) -> int:
        return 1200

    def pull(self) -> FanState:
        return Off()


class Fan:                                    # context: starts Off, the states move it on
    def __init__(self) -> None:
        self._state: FanState = Off()

    def pull_chain(self) -> None:             # the user only pulls; the STATE decides where to go
        self._state = self._state.pull()

    def run(self) -> str:
        return f"Fan at {self._state.rpm()} rpm"


if __name__ == "__main__":
    fan = Fan()
    print(fan.run())
    for _ in range(3):                        # the same action gives a different result each time
        fan.pull_chain()
        print(fan.run())
