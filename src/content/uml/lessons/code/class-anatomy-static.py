import math
from abc import ABC, abstractmethod


class Shape(ABC):                         # abstract class: name in italics
    @abstractmethod
    def area(self) -> float: ...          # abstract operation: italics, no body

    def describe(self) -> str:
        return f"{type(self).__name__} with area {self.area():.1f}"


class Circle(Shape):
    count: int = 0                        # static: underlined, one value for the class

    def __init__(self, radius: float):
        self._radius = radius
        Circle.count += 1

    def area(self) -> float:
        return math.pi * self._radius ** 2


print(Circle(1).describe(), Circle(2).describe())
print("circles made:", Circle.count)      # circles made: 2
