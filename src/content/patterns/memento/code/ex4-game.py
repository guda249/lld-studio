from dataclasses import dataclass


@dataclass(frozen=True)
class GameSave:                           # memento
    x: int
    y: int
    moves: int


class Player:                             # originator
    def __init__(self) -> None:
        self._x, self._y, self._moves = 0, 0, 0

    def step(self, direction: str) -> None:
        dx, dy = {"U": (0, 1), "D": (0, -1), "L": (-1, 0), "R": (1, 0)}[direction]
        self._x, self._y = self._x + dx, self._y + dy
        self._moves += 1

    def where(self) -> str:
        return f"({self._x},{self._y}) after {self._moves} moves"

    def save(self) -> GameSave:
        return GameSave(self._x, self._y, self._moves)

    def restore(self, s: GameSave) -> None:
        self._x, self._y, self._moves = s.x, s.y, s.moves


class UndoRedo:                           # caretaker with two stacks
    def __init__(self, player: Player) -> None:
        self._player = player
        self._undo: list[GameSave] = []
        self._redo: list[GameSave] = []

    def play(self, direction: str) -> None:
        self._undo.append(self._player.save())
        self._redo.clear()                # a new move throws away the redo branch
        self._player.step(direction)

    def undo(self) -> None:
        if self._undo:
            self._redo.append(self._player.save())
            self._player.restore(self._undo.pop())

    def redo(self) -> None:
        if self._redo:
            self._undo.append(self._player.save())
            self._player.restore(self._redo.pop())


player = Player()
game = UndoRedo(player)
for d in "RRU":
    game.play(d)
print("Played RRU:", player.where())
game.undo()
game.undo()
print("Undo x2:", player.where())
game.redo()
print("Redo:", player.where())
game.play("L")
game.redo()                               # nothing to redo any more
print("New move L, then redo:", player.where())
