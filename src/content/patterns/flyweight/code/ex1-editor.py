from dataclasses import dataclass


@dataclass(frozen=True)
class Glyph:
    """Flyweight: how a character looks. Shared by every place it appears."""
    char: str
    font: str
    size: int

    def render(self, row: int, col: int) -> str:     # position is passed in (extrinsic)
        return f"'{self.char}' {self.font}-{self.size} at ({row},{col})"


class GlyphFactory:
    def __init__(self) -> None:
        self._glyphs: dict[tuple[str, str, int], Glyph] = {}

    def get(self, char: str, font: str, size: int) -> Glyph:
        key = (char, font, size)
        if key not in self._glyphs:
            self._glyphs[key] = Glyph(char, font, size)
        return self._glyphs[key]

    def count(self) -> int:
        return len(self._glyphs)


@dataclass(slots=True)
class CharCell:
    """Context: one character on the page."""
    glyph: Glyph
    row: int
    col: int


factory = GlyphFactory()
text = ["namaste duniya", "hello world, hello india"]
cells = [
    CharCell(factory.get(ch, "Noto Sans", 12), row, col)
    for row, line in enumerate(text)
    for col, ch in enumerate(line)
]
print(f"{len(cells)} characters on screen, {factory.count()} glyph objects")
print(cells[0].glyph.render(cells[0].row, cells[0].col))
print(cells[-1].glyph.render(cells[-1].row, cells[-1].col))
