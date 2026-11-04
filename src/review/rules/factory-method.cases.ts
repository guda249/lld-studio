import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

/** Diagram that draws the concrete creators as associations instead of inheritance (disagrees with the code). */
const diagram: UmlModel = {"classes":[{"id":"Level","name":"Level","kind":"abstract","members":[]},{"id":"ForestLevel","name":"ForestLevel","kind":"concrete","members":[]},{"id":"Enemy","name":"Enemy","kind":"interface","members":[]},{"id":"Wolf","name":"Wolf","kind":"concrete","members":[]}],"relations":[{"id":"a","from":"ForestLevel","to":"Level","type":"association"},{"id":"b","from":"Wolf","to":"Enemy","type":"realization"},{"id":"c","from":"Level","to":"Enemy","type":"dependency"}]};

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct, different domain (report exporters, default factory method)",
    lang: "python",
    expect: {"found":true,"ids":["factory-method.shape","factory-method.creator-uses-it","factory-method.returns-interface","factory-method.default-product"],"none":["factory-method.creator-creates-concrete","factory-method.unused"]},
    code: `from abc import ABC, abstractmethod

class Formatter(ABC):
    @abstractmethod
    def format(self, rows: list[str]) -> str: ...

class CsvFormatter(Formatter):
    def format(self, rows: list[str]) -> str:
        return ",".join(rows)

class JsonFormatter(Formatter):
    def format(self, rows: list[str]) -> str:
        return str(rows)

class ReportExporter:
    def make_formatter(self) -> Formatter:
        return CsvFormatter()

    def export(self, rows: list[str]) -> str:
        formatter = self.make_formatter()
        return "report: " + formatter.format(rows)

class JsonExporter(ReportExporter):
    def make_formatter(self) -> Formatter:
        return JsonFormatter()

print(ReportExporter().export(["a"]), JsonExporter().export(["b"]))`
  },
  {
    name: "2 Scala 3, buggy: creator creates a product itself and returns a concrete type",
    lang: "scala",
    diagram,
    expect: {"found":true,"ids":["factory-method.creator-creates-concrete","factory-method.concrete-return-type","factory-method.one-creator","uml.rel-type"]},
    code: `trait Enemy:
  def hp: Int

class Wolf extends Enemy:
  def hp: Int = 50

abstract class Level:
  def createEnemy(): Wolf

  def spawnWave(n: Int): List[Enemy] =
    val boss = Wolf()
    boss :: List.fill(n)(createEnemy())

class ForestLevel extends Level:
  def createEnemy(): Wolf = Wolf()

@main def demo(): Unit =
  println(ForestLevel().spawnWave(2).map(_.hp))`
  },
  {
    name: "3 Python, buggy: factory method never used, products share no interface",
    lang: "python",
    expect: {"found":true,"ids":["factory-method.unused","factory-method.no-product-interface"]},
    code: `from abc import ABC, abstractmethod

class Wolf:
    def roar(self) -> str: return "awoo"

class Scorpion:
    def roar(self) -> str: return "tsss"

class Level(ABC):
    @abstractmethod
    def create_enemy(self): ...

    def spawn(self) -> str:
        return "spawned"

class ForestLevel(Level):
    def create_enemy(self):
        return Wolf()

class DesertLevel(Level):
    def create_enemy(self):
        return Scorpion()

print(ForestLevel().spawn())`
  },
  {
    name: "4 Scala 3, correct, function form (idiomatic)",
    lang: "scala",
    expect: {"found":true,"ids":["factory-method.function-form"]},
    code: `trait Gateway:
  def charge(amount: Int): String

class UpiGateway extends Gateway:
  def charge(amount: Int): String = s"UPI $amount"

class Checkout(makeGateway: () => Gateway):
  def pay(amount: Int): String = makeGateway().charge(amount)

@main def demo(): Unit =
  println(Checkout(() => UpiGateway()).pay(499))`
  },
  {
    name: "5 Python, not Factory Method (simple factory with if/elif)",
    lang: "python",
    expect: {"found":false,"ids":["factory-method.no-shape","factory-method.branches"]},
    code: `class Wolf:
    pass

class Scorpion:
    pass

class Level:
    def spawn(self, kind: str):
        if kind == "forest":
            return Wolf()
        elif kind == "desert":
            return Scorpion()
        raise ValueError(kind)`
  },
  {
    name: "6 Scala 3, not Factory Method (Strategy-like: overrides make nothing)",
    lang: "scala",
    expect: {"found":false,"ids":["factory-method.no-shape"]},
    code: `trait Discount:
  def apply(total: Int): Int

class Festive extends Discount:
  def apply(total: Int): Int = total * 9 / 10

class Bulk extends Discount:
  def apply(total: Int): Int = total - 100`
  },
];

export default cases;
