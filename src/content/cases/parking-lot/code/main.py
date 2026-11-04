from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum


class VehicleSize(Enum):
    SMALL = 1    # motorbike
    MEDIUM = 2   # car
    LARGE = 3    # van, bus


@dataclass(frozen=True)
class Vehicle:
    plate: str
    size: VehicleSize


class ParkingSpot:
    def __init__(self, spot_id: str, size: VehicleSize):
        self.spot_id = spot_id
        self.size = size
        self.vehicle: Vehicle | None = None

    def is_free(self) -> bool:
        return self.vehicle is None

    def fits(self, vehicle: Vehicle) -> bool:
        # a spot takes any vehicle that is the same size or smaller
        return self.is_free() and vehicle.size.value <= self.size.value

    def assign(self, vehicle: Vehicle) -> None:
        self.vehicle = vehicle

    def release(self) -> None:
        self.vehicle = None


class Level:
    def __init__(self, number: int, spots: list[ParkingSpot]):
        self.number = number
        self.spots = spots

    def free_count(self) -> int:
        return sum(1 for s in self.spots if s.is_free())


@dataclass(frozen=True)
class Ticket:
    ticket_id: str
    vehicle: Vehicle
    spot: ParkingSpot
    entry_minute: int


class SpotFinder(ABC):
    """Strategy: how to pick a spot. Swap it without touching ParkingLot."""

    @abstractmethod
    def find(self, levels: list[Level], vehicle: Vehicle) -> ParkingSpot | None: ...


class NearestFinder(SpotFinder):
    """Lowest level first, then the smallest spot that fits (keeps big spots for big vehicles)."""

    def find(self, levels: list[Level], vehicle: Vehicle) -> ParkingSpot | None:
        for level in levels:
            fitting = [s for s in level.spots if s.fits(vehicle)]
            if fitting:
                return min(fitting, key=lambda s: s.size.value)
        return None


class FeePolicy(ABC):
    """Strategy: how to charge. Weekend or event pricing is a new class, not an edit."""

    @abstractmethod
    def fee(self, ticket: Ticket, exit_minute: int) -> int: ...


class HourlyFee(FeePolicy):
    RATES = {VehicleSize.SMALL: 10, VehicleSize.MEDIUM: 20, VehicleSize.LARGE: 40}

    def fee(self, ticket: Ticket, exit_minute: int) -> int:
        minutes = exit_minute - ticket.entry_minute
        if minutes <= 15:
            return 0                       # short grace period
        hours = (minutes + 59) // 60       # every started hour counts
        return hours * self.RATES[ticket.vehicle.size]


class LotObserver(ABC):
    """Observer: anything that wants to hear when free spots change."""

    @abstractmethod
    def on_change(self, level: int, free: int) -> None: ...


class DisplayBoard(LotObserver):
    def __init__(self, name: str):
        self.name = name

    def on_change(self, level: int, free: int) -> None:
        print(f"  [{self.name}] level {level}: {free} free")


class ParkingLot:
    """Facade: the one entry point the gates call (park / leave)."""

    def __init__(self, levels: list[Level], finder: SpotFinder, fees: FeePolicy):
        self._levels = levels
        self._finder = finder
        self._fees = fees
        self._observers: list[LotObserver] = []
        self._active: dict[str, Ticket] = {}
        self._next_id = 1

    def subscribe(self, observer: LotObserver) -> None:
        self._observers.append(observer)

    def _notify(self, spot: ParkingSpot) -> None:
        level = next(l for l in self._levels if spot in l.spots)
        for o in self._observers:
            o.on_change(level.number, level.free_count())

    def park(self, vehicle: Vehicle, minute: int) -> Ticket | None:
        if any(t.vehicle.plate == vehicle.plate for t in self._active.values()):
            raise ValueError(f"{vehicle.plate} is already parked")
        spot = self._finder.find(self._levels, vehicle)
        if spot is None:
            return None                    # lot full for this size
        spot.assign(vehicle)
        ticket = Ticket(f"T{self._next_id}", vehicle, spot, minute)
        self._next_id += 1
        self._active[ticket.ticket_id] = ticket
        self._notify(spot)
        return ticket

    def leave(self, ticket_id: str, minute: int) -> int:
        ticket = self._active.pop(ticket_id, None)
        if ticket is None:
            raise KeyError(f"unknown ticket {ticket_id}")
        amount = self._fees.fee(ticket, minute)
        ticket.spot.release()
        self._notify(ticket.spot)
        return amount


def build_level(number: int, small: int, medium: int, large: int) -> Level:
    sizes = [VehicleSize.SMALL] * small + [VehicleSize.MEDIUM] * medium + [VehicleSize.LARGE] * large
    return Level(number, [ParkingSpot(f"L{number}-{i + 1:02d}", s) for i, s in enumerate(sizes)])


if __name__ == "__main__":
    lot = ParkingLot([build_level(1, 1, 2, 0), build_level(2, 0, 0, 1)], NearestFinder(), HourlyFee())
    lot.subscribe(DisplayBoard("Gate A"))

    bike = Vehicle("KA-01-B-1", VehicleSize.SMALL)
    car1 = Vehicle("KA-02-C-7", VehicleSize.MEDIUM)
    car2 = Vehicle("KA-03-C-9", VehicleSize.MEDIUM)
    van = Vehicle("KA-04-V-2", VehicleSize.LARGE)

    tickets = []
    for v, minute in [(bike, 540), (car1, 545), (car2, 550), (van, 560)]:
        t = lot.park(v, minute)
        if t:
            tickets.append(t)
            print(f"{v.plate} -> {t.spot.spot_id} ({t.ticket_id})")

    car3 = Vehicle("KA-05-C-4", VehicleSize.MEDIUM)
    print(f"{car3.plate} -> {'no spot' if lot.park(car3, 600) is None else 'parked'}")

    print(f"{car1.plate} pays {lot.leave(tickets[1].ticket_id, 545 + 130)}")   # 2h10m -> 3 hours
    print(f"{bike.plate} pays {lot.leave(tickets[0].ticket_id, 550)}")          # 10 min -> free
    t3 = lot.park(car3, 700)
    print(f"{car3.plate} -> {t3.spot.spot_id if t3 else 'no spot'}")
