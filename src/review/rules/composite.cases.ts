import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

/** The learner drew Department -> Employee as composition to a leaf instead of aggregation to the component. */
const diagram: UmlModel = {
  classes: [
    { id: "Staff", name: "Staff", kind: "interface", members: [] },
    { id: "Employee", name: "Employee", kind: "concrete", members: [] },
    { id: "Department", name: "Department", kind: "concrete", members: [] }
  ],
  relations: [
    { id: "a", from: "Employee", to: "Staff", type: "realization" },
    { id: "b", from: "Department", to: "Staff", type: "realization" },
    { id: "c", from: "Department", to: "Staff", type: "composition" }
  ]
};

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct (org chart, Protocol-free ABC)",
    lang: "python",
    diagram,
    expect: { found: true, ids: ["composite.shape", "composite.children-typed-component", "composite.recurses", "composite.uniform-interface", "uml.rel-type"], none: ["composite.no-recursion", "composite.no-add"] },
    code: `from abc import ABC, abstractmethod

class Staff(ABC):
    @abstractmethod
    def salary(self) -> int: ...

class Employee(Staff):
    def __init__(self, name: str, pay: int) -> None:
        self.name = name
        self.pay = pay

    def salary(self) -> int:
        return self.pay

class Department(Staff):
    def __init__(self, name: str) -> None:
        self.name = name
        self.members: list[Staff] = []

    def hire(self, member: Staff) -> None:
        self.members.append(member)

    def salary(self) -> int:
        total = 0
        for m in self.members:
            total += m.salary()
        return total

it = Department("IT")
it.hire(Employee("Asha", 90))
print(it.salary())`
  },
  {
    name: "2 Python, buggy (children typed as the leaf, no recursion, extra op only on composite)",
    lang: "python",
    expect: { found: true, ids: ["composite.children-concrete", "composite.no-recursion", "composite.op-not-in-component"], none: ["composite.recurses"] },
    code: `from abc import ABC, abstractmethod

class Staff(ABC):
    @abstractmethod
    def salary(self) -> int: ...

class Employee(Staff):
    def __init__(self, pay: int) -> None:
        self.pay = pay

    def salary(self) -> int:
        return self.pay

class Department(Staff):
    def __init__(self) -> None:
        self.members: list[Employee] = []

    def hire(self, member: Employee) -> None:
        self.members.append(member)

    def salary(self) -> int:
        return 0

    def headcount(self) -> int:
        return sum(1 for m in self.members)

    def names(self) -> list[str]:
        out = []
        for m in self.members:
            out.append(str(m.pay))
        return out`
  },
  {
    name: "3 Scala 3, correct (course made of modules and lessons)",
    lang: "scala",
    expect: { found: true, ids: ["composite.children-typed-component", "composite.recurses", "composite.uniform-interface"], none: ["composite.no-recursion", "composite.type-check"] },
    code: `import scala.collection.mutable

trait Part:
  def minutes: Int

class Lesson(title: String, length: Int) extends Part:
  def minutes: Int = length

class Module(title: String) extends Part:
  private val parts = mutable.ListBuffer.empty[Part]
  def add(p: Part): Module =
    parts += p
    this
  def minutes: Int = parts.map(_.minutes).sum

@main def course(): Unit =
  val m = Module("Basics").add(Lesson("Intro", 10)).add(Module("Deep dive").add(Lesson("UML", 25)))
  println(m.minutes)`
  },
  {
    name: "4 Scala 3, buggy (type match on children, nothing adds to the list)",
    lang: "scala",
    expect: { found: true, ids: ["composite.type-check", "composite.no-add"] },
    code: `import scala.collection.mutable

trait Part:
  def minutes: Int

class Lesson(length: Int) extends Part:
  def minutes: Int = length

class Module extends Part:
  private val parts = mutable.ListBuffer.empty[Part]
  def minutes: Int = parts.map {
    case l: Lesson => l.minutes
    case m: Module => m.minutes
  }.sum`
  },
  {
    name: "5 Python, not Composite (isinstance in a function, no shared type)",
    lang: "python",
    expect: { found: false, ids: ["composite.no-shape", "composite.type-checks"] },
    code: `class Lesson:
    def __init__(self, length: int) -> None:
        self.length = length

class Module:
    def __init__(self, parts: list) -> None:
        self.parts = parts

def minutes(item) -> int:
    if isinstance(item, Lesson):
        return item.length
    if isinstance(item, Module):
        return sum(minutes(p) for p in item.parts)
    return 0`
  }
];

export default cases;
