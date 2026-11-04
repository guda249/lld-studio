from abc import ABC, abstractmethod


class PlayerState(ABC):  # one class per state
    @abstractmethod
    def press(self, player: "Player") -> None: ...


class Playing(PlayerState):
    def press(self, player: "Player") -> None:
        player.state = Paused()  # transition


class Paused(PlayerState):
    def press(self, player: "Player") -> None:
        player.state = Playing()


class Player:
    def __init__(self):
        self.state: PlayerState = Paused()  # initial state

    def press(self) -> None:
        self.state.press(self)  # the state decides


player = Player()
for _ in range(3):
    player.press()
    print(type(player.state).__name__)
