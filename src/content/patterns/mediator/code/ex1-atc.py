from collections import deque


class Plane:  # colleague: talks only to the tower, never to other planes
    def __init__(self, call_sign: str, tower: "Tower") -> None:
        self.call_sign, self._tower = call_sign, tower

    def request_landing(self, emergency: bool = False) -> None:
        print(f"{self.call_sign}: requesting landing{' (low fuel!)' if emergency else ''}")
        self._tower.request_landing(self, emergency)

    def vacate_runway(self) -> None:
        print(f"{self.call_sign}: runway vacated")
        self._tower.runway_vacated(self)

    def receive(self, message: str) -> None:
        print(f"  tower -> {self.call_sign}: {message}")


class Tower:  # mediator: owns the one-runway rule and the landing queue
    def __init__(self) -> None:
        self._on_runway: Plane | None = None
        self._waiting: deque[Plane] = deque()

    def request_landing(self, plane: Plane, emergency: bool) -> None:
        if self._on_runway is None:
            self._clear(plane)
        elif emergency:
            self._waiting.appendleft(plane)  # jumps the queue
            plane.receive("priority granted, you are next")
        else:
            self._waiting.append(plane)
            plane.receive(f"hold, number {len(self._waiting)} in queue")

    def runway_vacated(self, plane: Plane) -> None:
        if plane is self._on_runway:
            self._on_runway = None
            if self._waiting:
                self._clear(self._waiting.popleft())

    def _clear(self, plane: Plane) -> None:
        self._on_runway = plane
        plane.receive("cleared to land, runway 27")


tower = Tower()
air_india, indigo, vistara, spicejet = (Plane(c, tower) for c in ("AI101", "6E202", "UK303", "SG404"))
air_india.request_landing()
indigo.request_landing()
vistara.request_landing()
spicejet.request_landing(emergency=True)
air_india.vacate_runway()
spicejet.vacate_runway()
