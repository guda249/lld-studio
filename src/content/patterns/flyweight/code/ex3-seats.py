from dataclasses import dataclass


@dataclass(frozen=True)
class SeatClass:
    """Flyweight: fare and perks, the same for every seat in the cabin class."""
    name: str
    fare: int
    legroom_cm: int
    perks: tuple[str, ...]

    def label(self, seat_no: str, booked: bool) -> str:  # extrinsic state comes in as arguments
        status = "booked" if booked else f"₹{self.fare:,}"
        return f"{seat_no} {self.name} {self.legroom_cm}cm {status}"


SEAT_CLASSES = {                                          # a fixed, pre-built pool of flyweights
    "business": SeatClass("Business", 24_000, 110, ("lounge", "meal", "priority")),
    "stretch": SeatClass("Stretch", 9_500, 86, ("meal",)),
    "economy": SeatClass("Economy", 5_200, 76, ()),
}


def class_for(row: int) -> SeatClass:
    if row <= 2:
        return SEAT_CLASSES["business"]
    return SEAT_CLASSES["stretch"] if row <= 5 else SEAT_CLASSES["economy"]


# The seat map only stores seat number -> (shared class, booked flag).
seat_map = {f"{row}{letter}": (class_for(row), False) for row in range(1, 31) for letter in "ABCDEF"}
seat_map["1A"] = (seat_map["1A"][0], True)

print(f"{len(seat_map)} seats, {len({id(c) for c, _ in seat_map.values()})} seat-class objects")
for seat_no in ["1A", "4C", "27F"]:
    seat_class, booked = seat_map[seat_no]
    print(seat_class.label(seat_no, booked))
