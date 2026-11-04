from dataclasses import dataclass, replace
from datetime import date


@dataclass(frozen=True)
class Trip:
    origin: str
    destination: str
    depart: date
    return_on: date | None
    travellers: int


@dataclass(frozen=True)
class TripBuilder:
    # an immutable builder: every step returns a new builder, so drafts can be shared safely
    origin: str = ""
    destination: str = ""
    depart: date | None = None
    return_on: date | None = None
    travellers: int = 1

    def route(self, origin: str, destination: str) -> "TripBuilder":
        return replace(self, origin=origin, destination=destination)

    def on(self, day: date) -> "TripBuilder":
        return replace(self, depart=day)

    def returning(self, day: date) -> "TripBuilder":
        return replace(self, return_on=day)

    def for_people(self, n: int) -> "TripBuilder":
        return replace(self, travellers=n)

    def build(self) -> Trip:
        if not self.origin or self.depart is None:
            raise ValueError("route and departure date are required")
        if self.return_on is not None and self.return_on < self.depart:
            raise ValueError("return date is before departure")
        return Trip(self.origin, self.destination, self.depart, self.return_on, self.travellers)


draft = TripBuilder().route("Delhi", "Goa").on(date(2026, 12, 20)).for_people(2)
one_way = draft.build()
round_trip = draft.returning(date(2026, 12, 27)).build()  # draft itself is unchanged

for trip in (one_way, round_trip):
    back = trip.return_on.isoformat() if trip.return_on else "one way"
    print(f"{trip.origin} -> {trip.destination}, {trip.depart.isoformat()}, back: {back}, {trip.travellers} people")

try:
    draft.returning(date(2026, 12, 1)).build()
except ValueError as error:
    print(f"Rejected: {error}")
