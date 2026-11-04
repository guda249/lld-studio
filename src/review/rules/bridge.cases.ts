import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

/** The learner drew the alert -> channel link as inheritance instead of a field (association). */
const diagram: UmlModel = {
  classes: [
    { id: "Alert", name: "Alert", kind: "abstract", members: [] },
    { id: "DebitAlert", name: "DebitAlert", kind: "concrete", members: [] },
    { id: "Channel", name: "Channel", kind: "interface", members: [] },
    { id: "Sms", name: "Sms", kind: "concrete", members: [] },
    { id: "Email", name: "Email", kind: "concrete", members: [] }
  ],
  relations: [
    { id: "a", from: "Alert", to: "Channel", type: "inheritance" },
    { id: "b", from: "DebitAlert", to: "Alert", type: "inheritance" },
    { id: "c", from: "Sms", to: "Channel", type: "realization" },
    { id: "d", from: "Email", to: "Channel", type: "realization" }
  ]
};

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct (alerts x channels, different names)",
    lang: "python",
    diagram,
    expect: { found: true, ids: ["bridge.shape", "bridge.two-hierarchies", "bridge.depends-on-interface", "bridge.delegates", "uml.rel-type"], none: ["bridge.abstraction-creates-impl", "bridge.no-delegation"] },
    code: `from abc import ABC, abstractmethod

class Channel(ABC):
    @abstractmethod
    def send(self, to: str, text: str) -> None: ...

class Sms(Channel):
    def send(self, to: str, text: str) -> None:
        print(f"SMS to {to}: {text}")

class Email(Channel):
    def send(self, to: str, text: str) -> None:
        print(f"Mail to {to}: {text}")

class Alert(ABC):
    def __init__(self, channel: Channel) -> None:
        self.channel = channel

    @abstractmethod
    def notify(self, customer: str) -> None: ...

class DebitAlert(Alert):
    def notify(self, customer: str) -> None:
        self.channel.send(customer, "Your account was debited")

class StatementAlert(Alert):
    def notify(self, customer: str) -> None:
        self.channel.send(customer, "Your statement is ready")

DebitAlert(Sms()).notify("Asha")
StatementAlert(Email()).notify("Ravi")`
  },
  {
    name: "2 Python, buggy (field repeated in each subclass, one creates its channel)",
    lang: "python",
    expect: { found: true, ids: ["bridge.field-not-in-base", "bridge.abstraction-creates-impl"], none: ["bridge.depends-on-interface"] },
    code: `from abc import ABC, abstractmethod

class Channel(ABC):
    @abstractmethod
    def send(self, to: str, text: str) -> None: ...

class Sms(Channel):
    def send(self, to: str, text: str) -> None:
        print(f"SMS to {to}: {text}")

class Email(Channel):
    def send(self, to: str, text: str) -> None:
        print(f"Mail to {to}: {text}")

class Alert(ABC):
    @abstractmethod
    def notify(self, customer: str) -> None: ...

class DebitAlert(Alert):
    def __init__(self) -> None:
        self.channel = Sms()

    def notify(self, customer: str) -> None:
        self.channel.send(customer, "Your account was debited")

class StatementAlert(Alert):
    def __init__(self, channel: Channel) -> None:
        self.channel = channel

    def notify(self, customer: str) -> None:
        self.channel.send(customer, "Your statement is ready")`
  },
  {
    name: "3 Scala 3, correct (shapes x drawing back-ends)",
    lang: "scala",
    expect: { found: true, ids: ["bridge.two-hierarchies", "bridge.depends-on-interface", "bridge.delegates"], none: ["bridge.concrete-field", "bridge.no-delegation"] },
    code: `trait Canvas:
  def line(x1: Int, y1: Int, x2: Int, y2: Int): Unit
  def circle(x: Int, y: Int, r: Int): Unit

class SvgCanvas extends Canvas:
  def line(x1: Int, y1: Int, x2: Int, y2: Int): Unit = println(s"<line $x1 $y1 $x2 $y2/>")
  def circle(x: Int, y: Int, r: Int): Unit = println(s"<circle $x $y $r/>")

class AsciiCanvas extends Canvas:
  def line(x1: Int, y1: Int, x2: Int, y2: Int): Unit = println("----")
  def circle(x: Int, y: Int, r: Int): Unit = println("(  )")

abstract class Shape(protected val canvas: Canvas):
  def draw(): Unit

class Dot(c: Canvas, x: Int, y: Int) extends Shape(c):
  def draw(): Unit = canvas.circle(x, y, 1)

class Square(c: Canvas, size: Int) extends Shape(c):
  def draw(): Unit =
    canvas.line(0, 0, size, 0)
    canvas.line(0, size, size, size)

@main def shapes(): Unit =
  Dot(SvgCanvas(), 2, 3).draw()
  Square(AsciiCanvas(), 4).draw()`
  },
  {
    name: "4 Scala 3, buggy (concrete-typed field, never called, type check)",
    lang: "scala",
    expect: { found: true, ids: ["bridge.concrete-field", "bridge.no-delegation", "bridge.type-check"] },
    code: `trait Canvas:
  def circle(x: Int, y: Int, r: Int): Unit

class SvgCanvas extends Canvas:
  def circle(x: Int, y: Int, r: Int): Unit = println(s"<circle $x $y $r/>")

class AsciiCanvas extends Canvas:
  def circle(x: Int, y: Int, r: Int): Unit = println("(  )")

abstract class Shape(protected val canvas: SvgCanvas):
  def draw(): Unit

class Dot(c: SvgCanvas) extends Shape(c):
  def draw(): Unit = canvas match
    case _: SvgCanvas => println("<circle/>")
    case _ => println("o")`
  },
  {
    name: "5 Scala 3, not Bridge (one class per combination)",
    lang: "scala",
    expect: { found: false, ids: ["bridge.no-shape", "bridge.class-explosion"] },
    code: `class DebitSms:
  def notify(to: String): Unit = println(s"SMS $to: debited")

class DebitEmail:
  def notify(to: String): Unit = println(s"Mail $to: debited")

class StatementSms:
  def notify(to: String): Unit = println(s"SMS $to: statement")

class StatementEmail:
  def notify(to: String): Unit = println(s"Mail $to: statement")`
  },
  {
    name: "6 Python, function form (idiomatic)",
    lang: "python",
    expect: { found: true, ids: ["bridge.function-form"] },
    code: `from collections.abc import Callable

Send = Callable[[str, str], None]

def by_sms(to: str, text: str) -> None:
    print(f"SMS {to}: {text}")

def by_email(to: str, text: str) -> None:
    print(f"Mail {to}: {text}")

class DebitAlert:
    def __init__(self, send: Send) -> None:
        self.send = send

    def notify(self, customer: str) -> None:
        self.send(customer, "Your account was debited")

DebitAlert(by_sms).notify("Asha")`
  }
];

export default cases;
