class MachineState:
    """Base state: refuses every action. Each state overrides only the actions it allows."""

    name = "?"

    def pay(self) -> "MachineState":
        return self._refuse("pay")

    def start(self) -> "MachineState":
        return self._refuse("start")

    def finish(self) -> "MachineState":
        return self._refuse("finish")

    def open_door(self) -> "MachineState":
        return self._refuse("open the door")

    def _refuse(self, action: str) -> "MachineState":
        print(f"can't {action} while {self.name}")
        return self


class Idle(MachineState):
    name = "idle"

    def pay(self) -> MachineState:
        print("paid: press start")
        return Paid()

    def start(self) -> MachineState:
        print("please pay first")
        return self


class Paid(MachineState):
    name = "paid"

    def start(self) -> MachineState:
        print("washing...")
        return Washing()


class Washing(MachineState):
    name = "washing"

    def finish(self) -> MachineState:
        print("done: open the door")
        return Done()

    def open_door(self) -> MachineState:
        print("door locked while washing")
        return self


class Done(MachineState):
    name = "done"

    def open_door(self) -> MachineState:
        print("door open: take your laundry")
        return Idle()


class WashingMachine:
    """The context: holds the current state and hands every action to it."""

    def __init__(self) -> None:
        self._state: MachineState = Idle()

    @property
    def status(self) -> str:
        return self._state.name

    def pay(self) -> None:
        self._state = self._state.pay()

    def start(self) -> None:
        self._state = self._state.start()

    def finish(self) -> None:
        self._state = self._state.finish()

    def open_door(self) -> None:
        self._state = self._state.open_door()


if __name__ == "__main__":
    machine = WashingMachine()
    machine.start()
    machine.pay()
    machine.pay()
    machine.start()
    machine.open_door()
    machine.finish()
    machine.open_door()
    print("status:", machine.status)
