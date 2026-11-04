import functools
from abc import ABC, abstractmethod
from collections.abc import Callable


# 1) Python's @decorator SYNTAX: wraps a FUNCTION once, when it is defined.
def logged(func: Callable[[int], str]) -> Callable[[int], str]:
    @functools.wraps(func)
    def wrapper(marks: int) -> str:
        result = func(marks)
        print(f"[fn log] {func.__name__}({marks}) -> {result}")
        return result
    return wrapper


@logged  # exactly the same as writing: grade_for = logged(grade_for)
def grade_for(marks: int) -> str:
    return "A" if marks >= 85 else "B" if marks >= 70 else "C"


# 2) The Decorator PATTERN: wraps an OBJECT at runtime, behind an interface.
class GradeBook(ABC):
    @abstractmethod
    def record(self, student: str, marks: int) -> str: ...


class SimpleGradeBook(GradeBook):
    def __init__(self) -> None:
        self.entries: dict[str, str] = {}

    def record(self, student: str, marks: int) -> str:
        grade = grade_for(marks)
        self.entries[student] = grade
        return grade


class AuditedGradeBook(GradeBook):
    def __init__(self, inner: GradeBook, teacher: str) -> None:
        self._inner = inner
        self._teacher = teacher

    def record(self, student: str, marks: int) -> str:
        grade = self._inner.record(student, marks)
        print(f"[audit]  {self._teacher} gave {student} grade {grade}")
        return grade


book = SimpleGradeBook()
book.record("Ravi", 72)                       # no audit, but grade_for is always logged
audited = AuditedGradeBook(book, "Ms. Iyer")  # this one object gets auditing
audited.record("Meera", 91)
print(", ".join(f"{name}={grade}" for name, grade in book.entries.items()))
