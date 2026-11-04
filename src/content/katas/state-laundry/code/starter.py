class WashingMachine:
    """A coin-operated machine in a laundromat. Every action checks the status string."""

    def __init__(self) -> None:
        self.status = "idle"

    def pay(self) -> None:
        if self.status == "idle":
            self.status = "paid"
            print("paid: press start")
        else:
            print(f"can't pay while {self.status}")

    def start(self) -> None:
        if self.status == "paid":
            self.status = "washing"
            print("washing...")
        elif self.status == "idle":
            print("please pay first")
        else:
            print(f"can't start while {self.status}")

    def finish(self) -> None:
        if self.status == "washing":
            self.status = "done"
            print("done: open the door")
        else:
            print(f"can't finish while {self.status}")

    def open_door(self) -> None:
        if self.status == "done":
            self.status = "idle"
            print("door open: take your laundry")
        elif self.status == "washing":
            print("door locked while washing")
        else:
            print(f"can't open the door while {self.status}")


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
