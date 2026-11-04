from abc import ABC, abstractmethod
from dataclasses import dataclass


class Space(ABC):
    """Every operation on the floor plan is a method here, so every space class must implement it."""

    @abstractmethod
    def area(self) -> float: ...

    @abstractmethod
    def cleaning_minutes(self) -> float: ...


@dataclass
class Room(Space):
    width: float
    length: float

    def area(self) -> float:
        return self.width * self.length

    def cleaning_minutes(self) -> float:
        return self.area() * 1.5


@dataclass
class Corridor(Space):
    length: float

    def area(self) -> float:
        return self.length * 2.0           # corridors are 2 m wide

    def cleaning_minutes(self) -> float:
        return self.length * 0.5           # a quick mop along the length


@dataclass
class Staircase(Space):
    flights: int

    def area(self) -> float:
        return 6.0 * self.flights

    def cleaning_minutes(self) -> float:
        return 10.0 * self.flights


if __name__ == "__main__":
    floor: list[Space] = [Room(4, 5), Room(3, 3), Corridor(12), Staircase(2)]
    print("area m2:", sum(space.area() for space in floor))
    print("cleaning min:", sum(space.cleaning_minutes() for space in floor))
