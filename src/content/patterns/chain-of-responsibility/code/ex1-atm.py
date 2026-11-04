class NoteDispenser:
    """Handler: pays out as many notes of its size as it can, then passes the rest on."""

    def __init__(self, note: int, next_dispenser: "NoteDispenser | None" = None) -> None:
        self.note = note
        self._next = next_dispenser

    def dispense(self, amount: int, notes: dict[int, int]) -> int:
        count = amount // self.note
        if count > 0:
            notes[self.note] = count
        rest = amount % self.note
        if rest > 0 and self._next is not None:
            return self._next.dispense(rest, notes)
        return rest  # whatever is left could not be paid


class Atm:
    def __init__(self) -> None:
        self._chain = NoteDispenser(2000, NoteDispenser(500, NoteDispenser(100)))

    def withdraw(self, amount: int) -> str:
        notes: dict[int, int] = {}
        left = self._chain.dispense(amount, notes)
        if left > 0:
            return f"₹{amount}: cannot dispense, use multiples of ₹100"
        parts = ", ".join(f"{count} x ₹{note}" for note, count in notes.items())
        return f"₹{amount}: {parts}"


atm = Atm()
for amount in (5600, 2000, 700, 450):
    print(atm.withdraw(amount))
