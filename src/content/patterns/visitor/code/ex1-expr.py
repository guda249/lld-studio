from abc import ABC, abstractmethod
from dataclasses import dataclass


class ExprVisitor[T](ABC):
    @abstractmethod
    def visit_num(self, node: "Num") -> T: ...

    @abstractmethod
    def visit_add(self, node: "Add") -> T: ...

    @abstractmethod
    def visit_mul(self, node: "Mul") -> T: ...


class Expr(ABC):
    @abstractmethod
    def accept[T](self, visitor: ExprVisitor[T]) -> T: ...


@dataclass
class Num(Expr):
    value: int

    def accept[T](self, visitor: ExprVisitor[T]) -> T:
        return visitor.visit_num(self)


@dataclass
class Add(Expr):
    left: Expr
    right: Expr

    def accept[T](self, visitor: ExprVisitor[T]) -> T:
        return visitor.visit_add(self)


@dataclass
class Mul(Expr):
    left: Expr
    right: Expr

    def accept[T](self, visitor: ExprVisitor[T]) -> T:
        return visitor.visit_mul(self)


class EvalVisitor(ExprVisitor[int]):
    def visit_num(self, node: Num) -> int: return node.value
    def visit_add(self, node: Add) -> int: return node.left.accept(self) + node.right.accept(self)
    def visit_mul(self, node: Mul) -> int: return node.left.accept(self) * node.right.accept(self)


class PrintVisitor(ExprVisitor[str]):
    def visit_num(self, node: Num) -> str: return str(node.value)
    def visit_add(self, node: Add) -> str: return f"({node.left.accept(self)} + {node.right.accept(self)})"
    def visit_mul(self, node: Mul) -> str: return f"{node.left.accept(self)} * {node.right.accept(self)}"


class PostfixVisitor(ExprVisitor[str]):
    def visit_num(self, node: Num) -> str: return str(node.value)
    def visit_add(self, node: Add) -> str: return f"{node.left.accept(self)} {node.right.accept(self)} +"
    def visit_mul(self, node: Mul) -> str: return f"{node.left.accept(self)} {node.right.accept(self)} *"


# (2 + 3) * 4 + 1, built as a tree the way a parser would
tree: Expr = Add(Mul(Add(Num(2), Num(3)), Num(4)), Num(1))
print("infix:  ", tree.accept(PrintVisitor()))
print("postfix:", tree.accept(PostfixVisitor()))
print("value:  ", tree.accept(EvalVisitor()))
