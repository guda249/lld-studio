import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

/** The learner drew the report classes as using the base class instead of extending it. */
const diagram: UmlModel = {"classes":[{"id":"Report","name":"Report","kind":"abstract","members":[]},{"id":"SalesReport","name":"SalesReport","kind":"concrete","members":[]},{"id":"StockReport","name":"StockReport","kind":"concrete","members":[]}],"relations":[{"id":"a","from":"SalesReport","to":"Report","type":"dependency"},{"id":"b","from":"StockReport","to":"Report","type":"inheritance"}]};

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct, other domain (@final template, a hook)",
    lang: "python",
    expect: {"found":true,"ids":["template-method.shape","template-method.skeleton-fixed","template-method.abstract-steps","template-method.steps-filled"],"none":["template-method.template-overridden","template-method.missing-step"]},
    code: `from abc import ABC, abstractmethod
from typing import final

class Beverage(ABC):
    @final
    def prepare(self) -> None:
        self.boil_water()
        self.brew()
        if self.wants_milk():
            self.add_milk()

    def boil_water(self) -> None:
        print("boiling")

    @abstractmethod
    def brew(self) -> None: ...

    def wants_milk(self) -> bool:
        return True

    def add_milk(self) -> None:
        print("milk")

class Tea(Beverage):
    def brew(self) -> None:
        print("steep the tea")

class BlackCoffee(Beverage):
    def brew(self) -> None:
        print("drip the coffee")
    def wants_milk(self) -> bool:
        return False

for b in (Tea(), BlackCoffee()):
    b.prepare()`
  },
  {
    name: "2 Python, buggy: a subclass overrides the template and another misses a step",
    lang: "python",
    diagram,
    expect: {"found":true,"ids":["template-method.template-overridden","template-method.missing-step","uml.rel-type"]},
    code: `from abc import ABC, abstractmethod

class Report(ABC):
    def build(self) -> str:
        return self.title() + "\\n" + self.body()

    @abstractmethod
    def title(self) -> str: ...

    @abstractmethod
    def body(self) -> str: ...

class SalesReport(Report):
    def title(self) -> str: return "Sales"
    def body(self) -> str: return "100 units"
    def build(self) -> str:
        return self.body() + " / " + self.title()

class StockReport(Report):
    def title(self) -> str: return "Stock"`
  },
  {
    name: "3 Scala 3, correct (abstract class, final template)",
    lang: "scala",
    expect: {"found":true,"ids":["template-method.skeleton-fixed","template-method.abstract-steps","template-method.steps-filled"],"none":["template-method.no-abstract-step","template-method.template-overridden"]},
    code: `abstract class Deployment:
  final def deploy(version: String): Unit =
    build(version)
    runTests()
    release(version)

  protected def build(version: String): Unit
  protected def runTests(): Unit = println("running unit tests")
  protected def release(version: String): Unit

class WebDeployment extends Deployment:
  protected def build(version: String): Unit = println(s"npm build $version")
  protected def release(version: String): Unit = println("upload to CDN")

class MobileDeployment extends Deployment:
  protected def build(version: String): Unit = println(s"gradle assemble $version")
  override protected def runTests(): Unit = println("running device tests")
  protected def release(version: String): Unit = println("submit to store")

@main def demo(): Unit =
  WebDeployment().deploy("1.2.0")
  MobileDeployment().deploy("1.2.0")`
  },
  {
    name: "4 Scala 3, buggy: no required step, and a subclass repeats the recipe",
    lang: "scala",
    expect: {"found":true,"ids":["template-method.no-abstract-step","template-method.duplicated-skeleton"]},
    code: `class Exporter:
  def export(): String =
    val d = load()
    write(d)

  def load(): String = "rows"
  def write(d: String): String = s"wrote $d"

class CsvExporter extends Exporter:
  override def write(d: String): String = s"csv $d"
  def exportTwice(): String =
    val d = load()
    write(d) + write(d)`
  },
  {
    name: "5 Python, not Template Method: two classes copy the same recipe",
    lang: "python",
    expect: {"found":false,"ids":["template-method.no-shape","template-method.duplicated-steps"]},
    code: `class PdfInvoice:
    def send(self, amount: int) -> None:
        text = f"Invoice: {amount}"
        print("rendering pdf")
        print(text.upper())

class EmailInvoice:
    def send(self, amount: int) -> None:
        text = f"Invoice: {amount}"
        print("rendering email")
        print(text.upper())`
  }
];

export default cases;
