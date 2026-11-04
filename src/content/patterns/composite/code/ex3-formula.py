from abc import ABC, abstractmethod
from dataclasses import dataclass

Cells = dict[str, float]


class Expr(ABC):  # component
    @abstractmethod
    def evaluate(self, cells: Cells) -> float: ...

    @abstractmethod
    def show(self) -> str: ...


@dataclass(frozen=True)
class Num(Expr):  # leaf
    value: float

    def evaluate(self, cells: Cells) -> float:
        return self.value

    def show(self) -> str:
        return str(self.value)


@dataclass(frozen=True)
class Ref(Expr):  # leaf: points at another cell
    cell: str

    def evaluate(self, cells: Cells) -> float:
        return cells[self.cell]

    def show(self) -> str:
        return self.cell


@dataclass(frozen=True)
class Add(Expr):  # composite with two children
    left: Expr
    right: Expr

    def evaluate(self, cells: Cells) -> float:
        return self.left.evaluate(cells) + self.right.evaluate(cells)

    def show(self) -> str:
        return f"({self.left.show()} + {self.right.show()})"


@dataclass(frozen=True)
class Mul(Expr):  # composite with two children
    left: Expr
    right: Expr

    def evaluate(self, cells: Cells) -> float:
        return self.left.evaluate(cells) * self.right.evaluate(cells)

    def show(self) -> str:
        return f"{self.left.show()} * {self.right.show()}"


@dataclass(frozen=True)
class Sum(Expr):  # composite with any number of children
    items: tuple[Expr, ...]

    def evaluate(self, cells: Cells) -> float:
        return sum(item.evaluate(cells) for item in self.items)

    def show(self) -> str:
        return "SUM(" + ", ".join(item.show() for item in self.items) + ")"


# Invoice total with GST: SUM(qty * price for each line) * (1 + gst rate)
total = Mul(Sum((Mul(Ref("B2"), Ref("C2")), Mul(Ref("B3"), Ref("C3")))), Add(Num(1.0), Ref("D1")))
cells: Cells = {"B2": 2.0, "C2": 450.0, "B3": 1.0, "C3": 1200.0, "D1": 0.18}

print(f"Formula: ={total.show()}")
print(f"Total: ₹{total.evaluate(cells):.2f}")
print(f"A single cell is an Expr too: C3 = {Ref('C3').evaluate(cells):.2f}")
print(f"After changing B2 to 3: ₹{total.evaluate(cells | {'B2': 3.0}):.2f}")
