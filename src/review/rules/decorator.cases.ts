import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

/** The learner drew Milk as owning a Chai, but the code wraps any Drink. */
const diagram: UmlModel = {
  classes: [
    { id: "Drink", name: "Drink", kind: "interface", members: [] },
    { id: "Chai", name: "Chai", kind: "concrete", members: [] },
    { id: "Milk", name: "Milk", kind: "concrete", members: [] },
    { id: "Sugar", name: "Sugar", kind: "concrete", members: [] }
  ],
  relations: [
    { id: "a", from: "Chai", to: "Drink", type: "realization" },
    { id: "b", from: "Milk", to: "Drink", type: "realization" },
    { id: "c", from: "Sugar", to: "Drink", type: "realization" },
    { id: "d", from: "Milk", to: "Chai", type: "composition" }
  ]
};

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct without a base decorator (chai add-ons)",
    lang: "python",
    diagram,
    expect: { found: true, ids: ["decorator.shape", "decorator.holds-component", "decorator.forwards", "decorator.stackable", "uml.rel-not-in-code"], none: ["decorator.no-forwarding", "decorator.missing-op"] },
    code: `from abc import ABC, abstractmethod

class Drink(ABC):
    @abstractmethod
    def cost(self) -> int: ...

    @abstractmethod
    def label(self) -> str: ...

class Chai(Drink):
    def cost(self) -> int:
        return 20

    def label(self) -> str:
        return "chai"

class Milk(Drink):
    def __init__(self, inner: Drink) -> None:
        self.inner = inner

    def cost(self) -> int:
        return self.inner.cost() + 10

    def label(self) -> str:
        return self.inner.label() + " + milk"

class Sugar(Drink):
    def __init__(self, inner: Drink) -> None:
        self.inner = inner

    def cost(self) -> int:
        return self.inner.cost() + 5

    def label(self) -> str:
        return self.inner.label() + " + sugar"

order = Sugar(Milk(Chai()))
print(order.label(), order.cost())`
  },
  {
    name: "2 Python, buggy (wraps a concrete type, drops a method, one doesn't forward)",
    lang: "python",
    expect: { found: true, ids: ["decorator.wraps-concrete", "decorator.missing-op", "decorator.no-forwarding"], none: ["decorator.forwards"] },
    code: `from abc import ABC, abstractmethod

class Drink(ABC):
    @abstractmethod
    def cost(self) -> int: ...

    @abstractmethod
    def label(self) -> str: ...

class Chai(Drink):
    def cost(self) -> int:
        return 20

    def label(self) -> str:
        return "chai"

class Milk(Drink):
    def __init__(self, inner: Chai) -> None:
        self.inner = inner

    def cost(self) -> int:
        return 30

class Sugar(Drink):
    def __init__(self, inner: Drink) -> None:
        self.inner = inner

    def cost(self) -> int:
        return self.inner.cost() + 5

    def label(self) -> str:
        return self.inner.label() + " + sugar"`
  },
  {
    name: "3 Scala 3, correct with a base decorator (storage)",
    lang: "scala",
    expect: { found: true, ids: ["decorator.holds-component", "decorator.forwards", "decorator.stackable"], none: ["decorator.no-forwarding", "decorator.creates-wrapped"] },
    code: `trait Storage:
  def save(key: String, data: String): Unit

class DiskStorage extends Storage:
  def save(key: String, data: String): Unit = println(s"disk <- $key")

abstract class StorageDecorator(inner: Storage) extends Storage:
  def save(key: String, data: String): Unit = inner.save(key, data)

class Compressed(s: Storage) extends StorageDecorator(s):
  override def save(key: String, data: String): Unit = super.save(key, data.take(10))

class Encrypted(s: Storage) extends StorageDecorator(s):
  override def save(key: String, data: String): Unit = super.save(key, data.reverse)

@main def store(): Unit =
  Encrypted(Compressed(DiskStorage())).save("a", "hello world")`
  },
  {
    name: "4 Scala 3, buggy (creates what it wraps, type check, one decorator)",
    lang: "scala",
    expect: { found: true, ids: ["decorator.creates-wrapped", "decorator.type-check", "decorator.one-decorator"] },
    code: `trait Storage:
  def save(key: String, data: String): Unit

class DiskStorage extends Storage:
  def save(key: String, data: String): Unit = println(s"disk <- $key")

class Encrypted extends Storage:
  private val inner = DiskStorage()
  def save(key: String, data: String): Unit = inner match
    case d: DiskStorage => d.save(key, data.reverse)
    case other => other.save(key, data)`
  },
  {
    name: "5 Python, not Decorator (features combined by subclassing)",
    lang: "python",
    expect: { found: false, ids: ["decorator.no-shape", "decorator.inheritance-combo"] },
    code: `class Chai:
    def cost(self) -> int:
        return 20

class MilkChai(Chai):
    def cost(self) -> int:
        return super().cost() + 10

class SugarMilkChai(MilkChai):
    def cost(self) -> int:
        return super().cost() + 5`
  }
];

export default cases;
