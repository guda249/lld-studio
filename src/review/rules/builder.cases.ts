import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

/** Diagram that draws the builder inheriting from the product, while the code only creates it. */
const diagram: UmlModel = {"classes":[{"id":"Pizza","name":"Pizza","kind":"concrete","members":[]},{"id":"PizzaBuilder","name":"PizzaBuilder","kind":"concrete","members":[]}],"relations":[{"id":"a","from":"PizzaBuilder","to":"Pizza","type":"inheritance"}]};

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct, different domain (pizza order)",
    lang: "python",
    diagram,
    expect: {"found":true,"ids":["builder.shape","builder.fluent-steps","builder.build-validates","builder.product-immutable","uml.rel-not-in-code"],"none":["builder.step-not-fluent","builder.no-validation","builder.product-created-directly"]},
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Pizza:
    size: str
    toppings: tuple[str, ...]
    extra_cheese: bool

class PizzaBuilder:
    def __init__(self) -> None:
        self._size = "medium"
        self._toppings: list[str] = []
        self._cheese = False

    def size(self, size: str) -> "PizzaBuilder":
        self._size = size
        return self

    def topping(self, name: str) -> "PizzaBuilder":
        self._toppings.append(name)
        return self

    def extra_cheese(self) -> "PizzaBuilder":
        self._cheese = True
        return self

    def build(self) -> Pizza:
        if len(self._toppings) > 5:
            raise ValueError("at most 5 toppings")
        return Pizza(self._size, tuple(self._toppings), self._cheese)

pizza = PizzaBuilder().size("large").topping("paneer").extra_cheese().build()
print(pizza)`
  },
  {
    name: "2 Python, buggy: setters return nothing, no checks, mutable product, product made directly",
    lang: "python",
    expect: {"found":true,"ids":["builder.step-not-fluent","builder.no-validation","builder.product-mutable","builder.product-created-directly"]},
    code: `class Pizza:
    def __init__(self, size: str, cheese: bool) -> None:
        self.size = size
        self.cheese = cheese

    def set_size(self, size: str) -> None:
        self.size = size

class PizzaBuilder:
    def __init__(self) -> None:
        self.size = "medium"
        self.cheese = False

    def set_size(self, size: str) -> None:
        self.size = size

    def set_cheese(self, cheese: bool) -> None:
        self.cheese = cheese

    def build(self) -> Pizza:
        return Pizza(self.size, self.cheese)

b = PizzaBuilder()
b.set_size("large")
b.set_cheese(True)
print(b.build().size, Pizza("small", False).size)`
  },
  {
    name: "3 Scala 3, correct, immutable builder with copy()",
    lang: "scala",
    expect: {"found":true,"ids":["builder.shape","builder.fluent-steps","builder.build-validates"],"none":["builder.step-not-fluent"]},
    code: `final case class Email(to: String, subject: String, body: String)

final case class EmailBuilder(to: String = "", subject: String = "", body: String = ""):
  def withTo(t: String): EmailBuilder = copy(to = t)
  def withSubject(s: String): EmailBuilder = copy(subject = s)
  def withBody(b: String): EmailBuilder = copy(body = b)
  def build(): Email =
    require(to.contains("@"), "a recipient is needed")
    Email(to, subject, body)

@main def demo(): Unit =
  println(EmailBuilder().withTo("a@b.in").withSubject("Hi").build())`
  },
  {
    name: "4 Scala 3, buggy: one-line build() with no checks",
    lang: "scala",
    expect: {"found":true,"ids":["builder.no-validation"]},
    code: `final case class Email(to: String, subject: String)

class EmailBuilder:
  private var to = ""
  private var subject = ""
  def withTo(t: String): EmailBuilder =
    to = t
    this
  def withSubject(s: String): EmailBuilder =
    subject = s
    this
  def build(): Email = Email(to, subject)`
  },
  {
    name: "5 Scala 3, not Builder (telescoping constructor)",
    lang: "scala",
    expect: {"found":false,"ids":["builder.no-shape","builder.long-constructor"]},
    code: `class Pizza(val size: String, val crust: String, val cheese: Boolean, val olives: Boolean, val paneer: Boolean, val slices: Int)

@main def demo(): Unit =
  val p = Pizza("large", "thin", true, false, true, 8)
  println(p.size)`
  },
  {
    name: "Scala, build() throws for a bad combination (validation seen), product case class with vals",
    lang: "scala",
    expect: { found: true, ids: ["builder.build-validates", "builder.product-immutable"], none: ["builder.no-validation"] },
    code: `case class Ticket(event: String, seats: Int, vip: Boolean)

class TicketBuilder(event: String):
  private var seats = 1
  private var vip = false
  def withSeats(n: Int): TicketBuilder =
    seats = n
    this
  def asVip(): TicketBuilder =
    vip = true
    this
  def build(): Ticket =
    if vip && seats > 4 then throw IllegalArgumentException("VIP tickets: at most 4 seats")
    Ticket(event, seats, vip)

@main def demo(): Unit =
  println(TicketBuilder("Concert").withSeats(2).asVip().build())
`
  },
  {
    name: "Python, product is a dataclass but not frozen (note), tuple-assigned builder fields are seen",
    lang: "python",
    expect: { found: true, ids: ["builder.product-not-frozen", "builder.defaults"] },
    code: `from dataclasses import dataclass


@dataclass
class Ticket:
    event: str
    seats: int
    vip: bool


class TicketBuilder:
    def __init__(self, event: str) -> None:
        self._event = event
        self._seats, self._vip = 1, False

    def with_seats(self, n: int) -> "TicketBuilder":
        self._seats = n
        return self

    def as_vip(self) -> "TicketBuilder":
        self._vip = True
        return self

    def build(self) -> Ticket:
        if self._vip and self._seats > 4:
            raise ValueError("VIP tickets: at most 4 seats")
        return Ticket(self._event, self._seats, self._vip)


print(TicketBuilder("Concert").with_seats(2).as_vip().build())
`
  }
];

export default cases;
