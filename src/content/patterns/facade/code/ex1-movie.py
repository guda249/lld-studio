class Lights:
    def dim(self, level: int) -> str:
        return f"lights at {level}%"


class AirConditioner:
    def set_temp(self, celsius: int) -> str:
        return f"AC at {celsius}°C"


class Projector:
    def on(self) -> str:
        return "projector on"

    def off(self) -> str:
        return "projector off"


class SoundBar:
    def surround(self, volume: int) -> str:
        return f"sound bar surround, volume {volume}"

    def mute(self) -> str:
        return "sound bar muted"


class HomeTheaterFacade:
    """One button in the app; four devices behind it."""

    def __init__(self, lights: Lights, ac: AirConditioner,
                 projector: Projector, sound: SoundBar) -> None:
        self._lights = lights
        self._ac = ac
        self._projector = projector
        self._sound = sound

    def watch_movie(self, title: str) -> list[str]:
        return [self._lights.dim(10), self._ac.set_temp(24),
                self._projector.on(), self._sound.surround(30), f"playing {title}"]

    def end_movie(self) -> list[str]:
        return [self._sound.mute(), self._projector.off(), self._lights.dim(80)]


home = HomeTheaterFacade(Lights(), AirConditioner(), Projector(), SoundBar())
print("Movie mode:", "; ".join(home.watch_movie("Sholay")))
print("Movie over:", "; ".join(home.end_movie()))
