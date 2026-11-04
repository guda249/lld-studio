from abc import ABC, abstractmethod


class Renderer(ABC):  # implementation side: drawing primitives
    name = "Renderer"

    @abstractmethod
    def circle(self, x: int, y: int, r: int, colour: str) -> str: ...

    @abstractmethod
    def rect(self, x: int, y: int, w: int, h: int, colour: str) -> str: ...


class DebugTextRenderer(Renderer):
    name = "debug text"

    def circle(self, x: int, y: int, r: int, colour: str) -> str:
        return f"circle ({x},{y}) r={r} {colour}"

    def rect(self, x: int, y: int, w: int, h: int, colour: str) -> str:
        return f"rect   ({x},{y}) {w}x{h} {colour}"


class SvgRenderer(Renderer):
    name = "SVG"

    def circle(self, x: int, y: int, r: int, colour: str) -> str:
        return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{colour}"/>'

    def rect(self, x: int, y: int, w: int, h: int, colour: str) -> str:
        return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{colour}"/>'


class Sprite(ABC):  # abstraction side: game objects built from primitives
    def __init__(self, renderer: Renderer, x: int, y: int) -> None:
        self.renderer = renderer  # the bridge
        self.x = x
        self.y = y

    @abstractmethod
    def draw(self) -> list[str]: ...


class Player(Sprite):
    def draw(self) -> list[str]:
        body = self.renderer.rect(self.x, self.y, 10, 20, "blue")
        head = self.renderer.circle(self.x + 5, self.y - 6, 6, "tan")
        return [body, head]


class Coin(Sprite):
    def draw(self) -> list[str]:
        return [self.renderer.circle(self.x, self.y, 4, "gold")]


for renderer in [DebugTextRenderer(), SvgRenderer()]:
    print(f"--- {renderer.name}")
    for sprite in [Player(renderer, 10, 40), Coin(renderer, 60, 50)]:
        for line in sprite.draw():
            print(line)
