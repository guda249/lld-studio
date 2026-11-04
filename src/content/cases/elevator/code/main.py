from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum


class Direction(Enum):
    UP = "up"
    DOWN = "down"
    IDLE = "idle"


@dataclass(frozen=True)
class Request:
    """A hall call: someone on `floor` pressed the up or down button."""
    floor: int
    direction: Direction


class ElevatorState(ABC):
    """State: each state decides what one tick means and which state comes next."""

    @abstractmethod
    def step(self, elevator: Elevator) -> None: ...

    @abstractmethod
    def direction(self) -> Direction: ...

    @abstractmethod
    def label(self) -> str: ...


class IdleState(ElevatorState):
    def step(self, elevator: Elevator) -> None:
        if not elevator.stops:
            return                                    # nothing to do: stay idle
        if elevator.floor in elevator.stops:
            elevator.stops.discard(elevator.floor)
            elevator.set_state(DoorsOpenState(Direction.IDLE))
        elif elevator.has_stops_above():
            elevator.set_state(MovingUpState())
        else:
            elevator.set_state(MovingDownState())

    def direction(self) -> Direction: return Direction.IDLE

    def label(self) -> str: return "Idle"


class MovingUpState(ElevatorState):
    def step(self, elevator: Elevator) -> None:
        elevator.floor += 1
        if elevator.floor in elevator.stops:
            elevator.stops.discard(elevator.floor)
            elevator.set_state(DoorsOpenState(Direction.UP))

    def direction(self) -> Direction: return Direction.UP

    def label(self) -> str: return "MovingUp"


class MovingDownState(ElevatorState):
    def step(self, elevator: Elevator) -> None:
        elevator.floor -= 1
        if elevator.floor in elevator.stops:
            elevator.stops.discard(elevator.floor)
            elevator.set_state(DoorsOpenState(Direction.DOWN))

    def direction(self) -> Direction: return Direction.DOWN

    def label(self) -> str: return "MovingDown"


class DoorsOpenState(ElevatorState):
    """Doors stay open for one tick, then close. Keep going the same way while stops remain that way."""

    def __init__(self, going: Direction):
        self.going = going

    def step(self, elevator: Elevator) -> None:
        elevator.stops.discard(elevator.floor)        # a call here is served by these open doors
        up, down = elevator.has_stops_above(), elevator.has_stops_below()
        if up and (self.going != Direction.DOWN or not down):
            elevator.set_state(MovingUpState())
        elif down:
            elevator.set_state(MovingDownState())
        else:
            elevator.set_state(IdleState())

    def direction(self) -> Direction: return self.going

    def label(self) -> str: return "DoorsOpen"


class Elevator:
    def __init__(self, name: str, floor: int):
        self.name = name
        self.floor = floor
        self.stops: set[int] = set()
        self._state: ElevatorState = IdleState()
        self._tick = 0

    def set_state(self, state: ElevatorState) -> None:
        print(f"t={self._tick:>2}  {self.name}: {self._state.label()} -> {state.label()} at floor {self.floor}")
        self._state = state

    def direction(self) -> Direction:
        return self._state.direction()

    def add_stop(self, floor: int) -> None:
        self.stops.add(floor)

    def has_stops_above(self) -> bool:
        return any(s > self.floor for s in self.stops)

    def has_stops_below(self) -> bool:
        return any(s < self.floor for s in self.stops)

    def is_resting(self) -> bool:
        return not self.stops and isinstance(self._state, IdleState)

    def step(self, tick: int) -> None:
        self._tick = tick
        self._state.step(self)


class DispatchStrategy(ABC):
    """Strategy: which elevator answers a hall call."""

    @abstractmethod
    def choose(self, elevators: list[Elevator], request: Request) -> Elevator: ...


class NearestCarStrategy(DispatchStrategy):
    """Closest car that is idle or already heading towards the caller in the same direction."""
    PENALTY = 10

    def cost(self, e: Elevator, request: Request) -> int:
        distance = abs(e.floor - request.floor)
        d = e.direction()
        if d == Direction.IDLE:
            return distance
        on_the_way_up = d == Direction.UP and request.direction == Direction.UP and request.floor >= e.floor
        on_the_way_down = d == Direction.DOWN and request.direction == Direction.DOWN and request.floor <= e.floor
        return distance if on_the_way_up or on_the_way_down else distance + self.PENALTY

    def choose(self, elevators: list[Elevator], request: Request) -> Elevator:
        return min(elevators, key=lambda e: (self.cost(e, request), e.name))


class ElevatorController:
    """Facade: the building's buttons talk to this one object."""

    def __init__(self, elevators: list[Elevator], strategy: DispatchStrategy, top_floor: int):
        self._elevators = elevators
        self._strategy = strategy
        self._top = top_floor
        self.tick = 0

    def _check(self, floor: int) -> None:
        if not 0 <= floor <= self._top:
            raise ValueError(f"no floor {floor}")

    def hall_call(self, request: Request) -> Elevator:
        self._check(request.floor)
        car = self._strategy.choose(self._elevators, request)
        car.add_stop(request.floor)
        print(f"t={self.tick:>2}  call at {request.floor} ({request.direction.value}) -> {car.name}")
        return car

    def car_call(self, name: str, floor: int) -> None:
        self._check(floor)
        next(e for e in self._elevators if e.name == name).add_stop(floor)
        print(f"t={self.tick:>2}  inside {name}: pressed {floor}")

    def step(self) -> None:
        self.tick += 1
        for e in self._elevators:
            e.step(self.tick)

    def all_resting(self) -> bool:
        return all(e.is_resting() for e in self._elevators)


if __name__ == "__main__":
    a, b = Elevator("A", 0), Elevator("B", 8)
    building = ElevatorController([a, b], NearestCarStrategy(), top_floor=9)

    building.hall_call(Request(5, Direction.DOWN))   # B is closer
    building.hall_call(Request(2, Direction.UP))     # A is closer
    script = {
        3: lambda: building.car_call("A", 7),
        4: lambda: (building.car_call("B", 0), building.hall_call(Request(6, Direction.UP))),
    }
    while building.tick < 30:
        building.step()
        if building.tick in script:
            script[building.tick]()
        if building.all_resting():
            break
    print(f"done at t={building.tick}: A at {a.floor}, B at {b.floor}")
