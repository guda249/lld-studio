from dataclasses import dataclass


@dataclass(frozen=True)
class FormSnapshot:
    """The memento: a read-only copy of the form's state at one moment."""
    step: int
    passengers: tuple[str, ...]
    insurance: bool


class BookingForm:
    """A multi-step flight booking form. It is the only class that knows its own fields."""

    def __init__(self) -> None:
        self.step = 1
        self.passengers: list[str] = []
        self.insurance = False

    def add_passenger(self, name: str) -> None:
        self.passengers.append(name)

    def next_step(self) -> None:
        self.step += 1

    def show(self) -> str:
        return f"step {self.step}: {', '.join(self.passengers) or 'nobody'}, insurance={self.insurance}"

    def save(self) -> FormSnapshot:
        return FormSnapshot(self.step, tuple(self.passengers), self.insurance)

    def restore(self, snapshot: FormSnapshot) -> None:
        self.step = snapshot.step
        self.passengers = list(snapshot.passengers)
        self.insurance = snapshot.insurance


class BackButton:
    """The caretaker: keeps snapshots in order and never looks inside them."""

    def __init__(self) -> None:
        self._history: list[FormSnapshot] = []

    def push(self, snapshot: FormSnapshot) -> None:
        self._history.append(snapshot)

    def pop(self) -> FormSnapshot:
        return self._history.pop()


if __name__ == "__main__":
    form, back = BookingForm(), BackButton()
    back.push(form.save())
    form.add_passenger("Asha")
    form.next_step()
    back.push(form.save())
    form.add_passenger("Ben")
    form.insurance = True
    form.next_step()
    print("now:      ", form.show())
    form.restore(back.pop())
    print("back once:", form.show())
    form.restore(back.pop())
    print("back again:", form.show())
