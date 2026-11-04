from abc import ABC, abstractmethod


class Hero:  # receiver
    def __init__(self) -> None:
        self.x, self.y = 0, 0

    def move(self, dx: int, dy: int) -> None:
        self.x += dx
        self.y += dy

    def position(self) -> str:
        return f"({self.x}, {self.y})"


class Command(ABC):
    name = "command"

    @abstractmethod
    def execute(self) -> None: ...

    @abstractmethod
    def undo(self) -> None: ...


class Move(Command):
    def __init__(self, hero: Hero, name: str, dx: int, dy: int) -> None:
        self._hero, self.name, self._dx, self._dy = hero, name, dx, dy

    def execute(self) -> None:
        self._hero.move(self._dx, self._dy)

    def undo(self) -> None:
        self._hero.move(-self._dx, -self._dy)


class Combo(Command):  # macro command: several commands acting as one
    def __init__(self, name: str, steps: list[Command]) -> None:
        self.name, self._steps = name, steps

    def execute(self) -> None:
        for step in self._steps:
            step.execute()

    def undo(self) -> None:
        for step in reversed(self._steps):
            step.undo()


class Game:  # invoker with undo and redo stacks
    def __init__(self, hero: Hero) -> None:
        self._hero = hero
        self._undo: list[Command] = []
        self._redo: list[Command] = []

    def _show(self, action: str) -> None:
        print(f"{action:<12} hero at {self._hero.position()}")

    def play(self, command: Command) -> None:
        command.execute()
        self._undo.append(command)
        self._redo.clear()  # a new move makes the old future invalid
        self._show(f"play {command.name}")

    def undo(self) -> None:
        if not self._undo:
            print("nothing to undo")
            return
        command = self._undo.pop()
        command.undo()
        self._redo.append(command)
        self._show(f"undo {command.name}")

    def redo(self) -> None:
        if not self._redo:
            print("nothing to redo")
            return
        command = self._redo.pop()
        command.execute()
        self._undo.append(command)
        self._show(f"redo {command.name}")


hero = Hero()
game = Game(hero)
game.play(Move(hero, "right", 1, 0))
game.play(Move(hero, "up", 0, 1))
game.play(Combo("dash", [Move(hero, "right", 1, 0) for _ in range(3)]))
game.undo()
game.undo()
game.redo()
game.play(Move(hero, "down", 0, -1))
game.redo()
