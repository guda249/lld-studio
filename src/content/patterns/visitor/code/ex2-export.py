from abc import ABC, abstractmethod
from dataclasses import dataclass


class BlockVisitor(ABC):
    @abstractmethod
    def visit_heading(self, block: "Heading") -> None: ...

    @abstractmethod
    def visit_paragraph(self, block: "Paragraph") -> None: ...

    @abstractmethod
    def visit_image(self, block: "Image") -> None: ...


class Block(ABC):
    @abstractmethod
    def accept(self, visitor: BlockVisitor) -> None: ...


@dataclass
class Heading(Block):
    text: str
    level: int

    def accept(self, visitor: BlockVisitor) -> None:
        visitor.visit_heading(self)


@dataclass
class Paragraph(Block):
    text: str

    def accept(self, visitor: BlockVisitor) -> None:
        visitor.visit_paragraph(self)


@dataclass
class Image(Block):
    caption: str
    path: str

    def accept(self, visitor: BlockVisitor) -> None:
        visitor.visit_image(self)


class MarkdownExporter(BlockVisitor):        # keeps state while it walks the document
    def __init__(self) -> None:
        self.lines: list[str] = []

    def visit_heading(self, block: Heading) -> None:
        self.lines.append("#" * block.level + " " + block.text)

    def visit_paragraph(self, block: Paragraph) -> None:
        self.lines.append(block.text)

    def visit_image(self, block: Image) -> None:
        self.lines.append(f"![{block.caption}]({block.path})")


class WordCounter(BlockVisitor):
    def __init__(self) -> None:
        self.words = 0
        self.images = 0

    def visit_heading(self, block: Heading) -> None:
        self.words += len(block.text.split())

    def visit_paragraph(self, block: Paragraph) -> None:
        self.words += len(block.text.split())

    def visit_image(self, block: Image) -> None:
        self.images += 1


article: list[Block] = [
    Heading("Monsoon in Kerala", 1),
    Paragraph("Carry a light raincoat and quick-dry shoes."),
    Image("Backwaters at Alleppey", "alleppey.jpg"),
    Heading("Getting around", 2),
    Paragraph("Book houseboats early because July weekends sell out fast."),
]
exporter, counter = MarkdownExporter(), WordCounter()
for block in article:
    block.accept(exporter)
    block.accept(counter)
print("\n".join(exporter.lines))
print(f"--- {counter.words} words, {counter.images} image(s)")
