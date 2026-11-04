import math
from abc import ABC, abstractmethod


class Shape(ABC):  # an interface: says WHAT every shape can do, not HOW
    @abstractmethod
    def area(self) -> float: ...

    @abstractmethod
    def name(self) -> str: ...


class Circle(Shape):  # implements the interface
    def __init__(self, radius: float) -> None:
        self._radius = radius

    def area(self) -> float:
        return math.pi * self._radius**2

    def name(self) -> str:
        return "circle"


class Rectangle(Shape):
    def __init__(self, width: float, height: float) -> None:
        self._width, self._height = width, height

    def area(self) -> float:
        return self._width * self._height

    def name(self) -> str:
        return "rectangle"


class Square(Rectangle):  # inheritance: reuses Rectangle's code, changes only the name
    def __init__(self, side: float) -> None:
        super().__init__(side, side)

    def name(self) -> str:
        return "square"


def report(shapes: list[Shape]) -> None:  # polymorphism: one call, the right code runs
    for s in shapes:
        print(f"{s.name()}: {s.area():.1f}")


if __name__ == "__main__":
    report([Circle(1), Rectangle(2, 3), Square(4)])
