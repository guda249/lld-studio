import type { ReviewCase } from "../cases";

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct with other names (enemy prefabs, list() copies)",
    lang: "python",
    expect: { found: true, ids: ["prototype.shape", "prototype.deep-copy", "prototype.interface", "prototype.registry-copies"], none: ["prototype.shallow-copy", "prototype.registry-leaks"] },
    code: `from abc import ABC, abstractmethod

class Spawnable(ABC):
    @abstractmethod
    def clone(self) -> "Spawnable": ...

class Enemy(Spawnable):
    def __init__(self, kind: str, loot: list[str]) -> None:
        self.kind = kind
        self.loot: list[str] = loot

    def clone(self) -> "Enemy":
        return Enemy(self.kind, list(self.loot))

class Prefabs:
    def __init__(self) -> None:
        self._items: dict[str, Enemy] = {}

    def add(self, name: str, e: Enemy) -> None:
        self._items[name] = e

    def spawn(self, name: str) -> Enemy:
        return self._items[name].clone()

p = Prefabs()
p.add("goblin", Enemy("goblin", ["coin"]))
print(p.spawn("goblin").loot)`
  },
  {
    name: "2 Python, buggy: shallow copy and a registry that leaks the template",
    lang: "python",
    expect: { found: true, ids: ["prototype.shallow-copy", "prototype.registry-leaks"], none: ["prototype.deep-copy"] },
    code: `import copy
from abc import ABC, abstractmethod

class Prototype(ABC):
    @abstractmethod
    def duplicate(self) -> "Prototype": ...

class Report(Prototype):
    def __init__(self, title: str) -> None:
        self.title = title
        self.pages: list[str] = []

    def duplicate(self) -> "Report":
        return copy.copy(self)

class Templates:
    def __init__(self) -> None:
        self._store: dict[str, Report] = {}

    def get(self, key: str) -> Report:
        return self._store[key]`
  },
  {
    name: "3 Scala 3, buggy: copy shares the mutable buffer, no trait",
    lang: "scala",
    expect: { found: true, ids: ["prototype.shallow-copy", "prototype.no-interface"], none: ["prototype.deep-copy"] },
    code: `import scala.collection.mutable

class Order(val customer: String, val items: mutable.ListBuffer[String]):
  def duplicate(): Order = Order(customer, items)

@main def demo(): Unit =
  val first = Order("Asha", mutable.ListBuffer("tea"))
  val again = first.duplicate()
  again.items += "cake"
  println(first.items)`
  },
  {
    name: "4 Scala 3, correct: trait + deep copy + registry",
    lang: "scala",
    expect: { found: true, ids: ["prototype.deep-copy", "prototype.interface", "prototype.registry-copies"], none: ["prototype.shallow-copy", "prototype.registry-leaks"] },
    code: `import scala.collection.mutable

trait Copyable[T]:
  def duplicate(): T

class Preset(val name: String, val tags: mutable.ListBuffer[String]) extends Copyable[Preset]:
  def duplicate(): Preset = Preset(name, mutable.ListBuffer.from(tags))

class PresetStore:
  private val presets = mutable.Map.empty[String, Preset]
  def put(key: String, p: Preset): Unit = presets(key) = p
  def take(key: String): Preset = presets(key).duplicate()

@main def demo(): Unit =
  val store = PresetStore()
  store.put("basic", Preset("basic", mutable.ListBuffer("a")))
  println(store.take("basic").tags)`
  },
  {
    name: "5 Scala 3, idiomatic case class + copy",
    lang: "scala",
    expect: { found: true, ids: ["prototype.idiomatic"], none: ["prototype.no-shape", "prototype.shallow-copy"] },
    code: `final case class Plan(name: String, seats: Int, features: List[String])

val basic = Plan("Basic", 1, List("email"))

@main def demo(): Unit =
  val team = basic.copy(name = "Team", seats = 10)
  println(team)`
  },
  {
    name: "6 Python, not Prototype: every object built by hand",
    lang: "python",
    expect: { found: false, ids: ["prototype.no-shape", "prototype.repeated-setup"] },
    code: `class Invoice:
    def __init__(self, client: str) -> None:
        self.client = client
        self.lines: list[str] = []

a = Invoice("Ravi")
a.lines += ["Hosting", "Support"]
b = Invoice("Meena")
b.lines += ["Hosting", "Support"]
print(a.lines, b.lines)`
  },
];

export default cases;
