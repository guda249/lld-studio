from abc import ABC, abstractmethod


class PlayerState(ABC):                                # state (shared, stateless objects)
    label = ""

    @abstractmethod
    def press_play(self, p: "MusicPlayer") -> None: ...

    def press_stop(self, p: "MusicPlayer") -> None:
        p.position = 0
        p.change_to(STOPPED)


class Stopped(PlayerState):
    label = "stopped"

    def press_play(self, p: "MusicPlayer") -> None:
        print(f"  start '{p.track}' from 0:00")
        p.change_to(PLAYING)

    def press_stop(self, p: "MusicPlayer") -> None:
        print("  already stopped")


class Playing(PlayerState):
    label = "playing"

    def press_play(self, p: "MusicPlayer") -> None:     # the same button now pauses
        p.position += 42                               # pretend 42 seconds were heard
        print(f"  pause at 0:{p.position:02d}")
        p.change_to(PAUSED)


class Paused(PlayerState):
    label = "paused"

    def press_play(self, p: "MusicPlayer") -> None:
        print(f"  resume from 0:{p.position:02d}")
        p.change_to(PLAYING)


STOPPED, PLAYING, PAUSED = Stopped(), Playing(), Paused()   # one shared instance each


class MusicPlayer:                                     # context
    def __init__(self, track: str) -> None:
        self.track, self.position = track, 0
        self._state: PlayerState = STOPPED

    def change_to(self, state: PlayerState) -> None:
        self._state = state
        print(f"  [{state.label}]")

    def press_play(self) -> None:
        self._state.press_play(self)

    def press_stop(self) -> None:
        self._state.press_stop(self)


player = MusicPlayer("Kesariya")
for button in ["play", "play", "play", "stop", "stop"]:
    print(f"press {button}")
    if button == "play":
        player.press_play()
    else:
        player.press_stop()
