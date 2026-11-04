import random
from abc import ABC, abstractmethod


class TurnGame(ABC):
    def play(self, players: list[str]) -> str:      # the template method
        self.setup(players)
        turn = 0
        while not self.is_over() and turn < self.max_turns():
            self.take_turn(players[turn % len(players)])
            turn += 1
        return f"{self.winner()} wins after {turn} turns"

    def setup(self, players: list[str]) -> None:     # hook: nothing by default
        pass

    def max_turns(self) -> int:                      # hook: a safety limit
        return 100

    @abstractmethod
    def take_turn(self, player: str) -> None: ...

    @abstractmethod
    def is_over(self) -> bool: ...

    @abstractmethod
    def winner(self) -> str: ...


class NimGame(TurnGame):
    """Take 1 to 3 sticks; whoever takes the last stick wins."""

    def __init__(self, sticks: int):
        self.sticks, self.last = sticks, ""

    def take_turn(self, player: str) -> None:
        take = self.sticks % 4 or 1
        self.sticks -= take
        self.last = player
        print(f"  {player} takes {take}, {self.sticks} left")

    def is_over(self) -> bool:
        return self.sticks == 0

    def winner(self) -> str:
        return self.last


class DiceRace(TurnGame):
    """First to reach the target score wins."""

    def __init__(self, target: int, seed: int):
        self.target, self.rng, self.scores = target, random.Random(seed), {}

    def setup(self, players: list[str]) -> None:
        self.scores = {p: 0 for p in players}

    def take_turn(self, player: str) -> None:
        self.scores[player] += self.rng.randint(1, 6)

    def is_over(self) -> bool:
        return any(s >= self.target for s in self.scores.values())

    def winner(self) -> str:
        return max(self.scores, key=self.scores.__getitem__)


print("Nim:", NimGame(10).play(["Asha", "Ravi"]))
print("Dice race:", DiceRace(target=15, seed=7).play(["Asha", "Ravi", "Meena"]))
