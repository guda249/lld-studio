from abc import ABC, abstractmethod
from dataclasses import dataclass


class SpaceVisitor(ABC):
    """One operation over the floor plan; one visit method per kind of space."""

    @abstractmethod
    def visit_room(self, room: "Room") -> float: ...

    @abstractmethod
    def visit_corridor(self, corridor: "Corridor") -> float: ...

    @abstractmethod
    def visit_staircase(self, stairs: "Staircase") -> float: ...


class Space(ABC):
    @abstractmethod
    def accept(self, visitor: SpaceVisitor) -> float: ...


@dataclass
class Room(Space):
    width: float
    length: float

    def accept(self, visitor: SpaceVisitor) -> float:
        return visitor.visit_room(self)


@dataclass
class Corridor(Space):
    length: float

    def accept(self, visitor: SpaceVisitor) -> float:
        return visitor.visit_corridor(self)


@dataclass
class Staircase(Space):
    flights: int

    def accept(self, visitor: SpaceVisitor) -> float:
        return visitor.visit_staircase(self)


class AreaVisitor(SpaceVisitor):
    def visit_room(self, room: Room) -> float:
        return room.width * room.length

    def visit_corridor(self, corridor: Corridor) -> float:
        return corridor.length * 2.0       # corridors are 2 m wide

    def visit_staircase(self, stairs: Staircase) -> float:
        return 6.0 * stairs.flights


class CleaningVisitor(SpaceVisitor):
    def visit_room(self, room: Room) -> float:
        return room.width * room.length * 1.5

    def visit_corridor(self, corridor: Corridor) -> float:
        return corridor.length * 0.5       # a quick mop along the length

    def visit_staircase(self, stairs: Staircase) -> float:
        return 10.0 * stairs.flights


if __name__ == "__main__":
    floor: list[Space] = [Room(4, 5), Room(3, 3), Corridor(12), Staircase(2)]
    print("area m2:", sum(space.accept(AreaVisitor()) for space in floor))
    print("cleaning min:", sum(space.accept(CleaningVisitor()) for space in floor))
