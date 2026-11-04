from collections import deque
from dataclasses import dataclass


@dataclass(frozen=True)
class CanvasSnapshot:                     # memento
    shapes: tuple[str, ...]
    fill: str


class Canvas:                             # originator
    def __init__(self) -> None:
        self._shapes: list[str] = []
        self._fill = "white"

    def add_shape(self, shape: str) -> None:
        self._shapes.append(shape)

    def set_fill(self, colour: str) -> None:
        self._fill = colour

    def describe(self) -> str:
        return f"{len(self._shapes)} shapes {self._shapes}, fill={self._fill}"

    def save(self) -> CanvasSnapshot:
        return CanvasSnapshot(tuple(self._shapes), self._fill)

    def restore(self, snap: CanvasSnapshot) -> None:
        self._shapes = list(snap.shapes)
        self._fill = snap.fill


class UndoStack:                          # caretaker with a size limit
    def __init__(self, limit: int) -> None:
        self._snaps: deque[CanvasSnapshot] = deque(maxlen=limit)

    def push(self, snap: CanvasSnapshot) -> None:
        self._snaps.append(snap)          # the oldest one drops off when full

    def pop(self) -> CanvasSnapshot | None:
        return self._snaps.pop() if self._snaps else None

    def size(self) -> int:
        return len(self._snaps)


canvas, undo = Canvas(), UndoStack(limit=3)
for shape in ["circle", "square", "arrow", "star", "text"]:
    undo.push(canvas.save())
    canvas.add_shape(shape)
undo.push(canvas.save())
canvas.set_fill("saffron")
print("Now:", canvas.describe())
print("Undo slots kept:", undo.size())

while (snap := undo.pop()) is not None:
    canvas.restore(snap)
    print("Undo ->", canvas.describe())
print("No more undo: the oldest steps were pruned to save memory.")
