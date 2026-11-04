import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

/** The learner drew Tree inheriting from TreeType; in the code Tree holds one. */
const diagram: UmlModel = {"classes":[{"id":"TreeType","name":"TreeType","kind":"concrete","members":[]},{"id":"TreeTypes","name":"TreeTypes","kind":"singleton","members":[]},{"id":"Tree","name":"Tree","kind":"concrete","members":[]}],"relations":[{"id":"a","from":"Tree","to":"TreeType","type":"inheritance"},{"id":"b","from":"TreeTypes","to":"TreeType","type":"dependency"}]};

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct in another domain (forest, setdefault cache)",
    lang: "python",
    expect: {"found":true,"ids":["flyweight.shape","flyweight.immutable","flyweight.uses-factory","flyweight.context-split"],"none":["flyweight.mutable","flyweight.bypasses-factory"]},
    code: `from dataclasses import dataclass


@dataclass(frozen=True)
class TreeType:
    name: str
    texture: str


class Forest:
    def __init__(self) -> None:
        self._types: dict[str, TreeType] = {}

    def tree_type(self, name: str, texture: str) -> TreeType:
        return self._types.setdefault(name, TreeType(name, texture))


@dataclass
class Tree:
    x: int
    y: int
    kind: TreeType


forest = Forest()
trees = [Tree(i, i * 2, forest.tree_type("oak", "oak.png")) for i in range(1000)]
print(len(trees))`
  },
  {
    name: "2 Scala 3, buggy: shared object can change, client skips the factory, context copies intrinsic data",
    lang: "scala",
    expect: {"found":true,"ids":["flyweight.mutable","flyweight.bypasses-factory","flyweight.context-duplicates"]},
    code: `import scala.collection.mutable

class Glyph(var font: String, var size: Int):
  def resize(s: Int): Unit = size = s

object Glyphs:
  private val cache = mutable.Map.empty[(String, Int), Glyph]
  def get(font: String, size: Int): Glyph = cache.getOrElseUpdate((font, size), Glyph(font, size))

case class Letter(ch: Char, row: Int, col: Int, font: String, glyph: Glyph)

@main def demo(): Unit =
  val a = Letter('a', 0, 0, "Mono", Glyphs.get("Mono", 12))
  val b = Letter('b', 0, 1, "Mono", Glyph("Mono", 12))
  println(a.glyph eq b.glyph)`
  },
  {
    name: "3 Python, a factory with no cache",
    lang: "python",
    expect: {"found":false,"ids":["flyweight.no-cache"]},
    code: `class SeatStyle:
    def __init__(self, colour: str) -> None:
        self.colour = colour


class SeatStyles:
    def get(self, colour: str) -> SeatStyle:
        return SeatStyle(colour)


styles = SeatStyles()
print(styles.get("red") is styles.get("red"))`
  },
  {
    name: "4 Scala 3, not a flyweight: every sprite keeps its own image",
    lang: "scala",
    expect: {"found":false,"ids":["flyweight.no-shape","flyweight.duplicated-state"]},
    code: `case class Sprite(x: Int, y: Int, image: Array[Byte], tint: String)

@main def demo(): Unit =
  val all = (0 until 500).map(i => Sprite(i, i, Array.fill[Byte](1000)(0), "red"))
  println(all.size)`
  },
  {
    name: "5 Scala 3, correct with a diagram that draws inheritance instead of a field",
    lang: "scala",
    diagram,
    expect: {"found":true,"ids":["flyweight.shape","flyweight.uses-factory","uml.rel-type"]},
    code: `import scala.collection.concurrent.TrieMap

final case class TreeType(name: String, texture: String)

object TreeTypes:
  private val cache = TrieMap.empty[String, TreeType]
  def of(name: String, texture: String): TreeType = cache.getOrElseUpdate(name, TreeType(name, texture))

final case class Tree(x: Int, y: Int, kind: TreeType)

@main def demo(): Unit =
  val trees = (0 until 1000).map(i => Tree(i, i, TreeTypes.of("oak", "oak.png")))
  println(trees.size)`
  },
  {
    name: "6 Python, functools.cache factory",
    lang: "python",
    expect: {"found":true,"ids":["flyweight.function-factory","flyweight.uses-factory"]},
    code: `from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Icon:
    path: str


@lru_cache(maxsize=None)
def icon(path: str) -> Icon:
    return Icon(path)


@dataclass(slots=True)
class Pin:
    lat: float
    lng: float
    icon: Icon


pins = [Pin(1.0, 2.0, icon("pin.png")) for _ in range(10)]
print(pins[0].icon is pins[-1].icon)`
  }
];

export default cases;
