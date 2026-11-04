class BookingForm:
    """A multi-step flight booking form."""

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


class BackButton:
    """Remembers earlier versions of the form by copying its fields from the outside."""

    def __init__(self) -> None:
        self.saved: list[tuple[int, list[str], bool]] = []

    def remember(self, form: BookingForm) -> None:
        self.saved.append((form.step, list(form.passengers), form.insurance))

    def go_back(self, form: BookingForm) -> None:
        # A new field on BookingForm (say, a meal choice) is silently not restored here.
        step, passengers, insurance = self.saved.pop()
        form.step = step
        form.passengers = passengers
        form.insurance = insurance


if __name__ == "__main__":
    form, back = BookingForm(), BackButton()
    back.remember(form)
    form.add_passenger("Asha")
    form.next_step()
    back.remember(form)
    form.add_passenger("Ben")
    form.insurance = True
    form.next_step()
    print("now:      ", form.show())
    back.go_back(form)
    print("back once:", form.show())
    back.go_back(form)
    print("back again:", form.show())
