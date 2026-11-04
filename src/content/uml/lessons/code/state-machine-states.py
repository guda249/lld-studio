from enum import Enum


class DoorState(Enum):  # one value per state box
    OPEN = "Open"
    CLOSED = "Closed"
    LOCKED = "Locked"


class Door:
    def __init__(self):
        self.state = DoorState.CLOSED  # current state

    def _go(self, start: DoorState, end: DoorState) -> None:
        if self.state == start:  # in the right state?
            self.state = end

    def open(self) -> None:
        self._go(DoorState.CLOSED, DoorState.OPEN)

    def close(self) -> None:
        self._go(DoorState.OPEN, DoorState.CLOSED)

    def lock(self) -> None:
        self._go(DoorState.CLOSED, DoorState.LOCKED)

    def unlock(self) -> None:
        self._go(DoorState.LOCKED, DoorState.CLOSED)


door = Door()
door.lock()
door.open()  # ignored: a locked door can't open
print(door.state.value)  # Locked
