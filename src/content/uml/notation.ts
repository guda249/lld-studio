/**
 * Notation lab: every symbol a learner meets in UML Basics, with a plain-English meaning and, where the symbol maps
 * to code, the Python 3.12 and Scala 3 lines it stands for. Snippets are short; they must parse, they need not run.
 */
import type { NotationSymbol } from "../guides/types";

const symbols: NotationSymbol[] = [
  /* ---------------- Class box ---------------- */
  {
    id: "concrete-class",
    group: "Class box",
    name: "Class box",
    glyph: "box:concrete",
    meaning: "A rectangle with three parts: the **name** at the top, the **attributes** (data) in the middle, the **operations** (methods) at the bottom. A plain name means an ordinary class you can create objects from.",
    code: {
      python: `class Account:
    def __init__(self, owner: str) -> None:
        self.owner = owner

    def close(self) -> None:
        print("closed")`,
      scala: `class Account(val owner: String):
  def close(): Unit = println("closed")`,
    },
  },
  {
    id: "public",
    group: "Class box",
    name: "Public",
    glyph: "text:+",
    meaning: "`+` before a member means **public**: any other class may read or call it. This is the class's promise to the outside world.",
    code: {
      python: `class Cart:
    def add(self, item: str) -> None:  # + add(item)
        print(item)`,
      scala: `class Cart:
  def add(item: String): Unit = println(item)`,
    },
  },
  {
    id: "private",
    group: "Class box",
    name: "Private",
    glyph: "text:-",
    meaning: "`-` means **private**: only the class itself may touch it. Python has no hard rule, so a leading underscore (`_total`) says \"hands off\"; Scala enforces it with `private`.",
    code: {
      python: `class Cart:
    def __init__(self) -> None:
        self._total = 0.0  # - total: float`,
      scala: `class Cart:
  private var total: Double = 0.0`,
    },
  },
  {
    id: "protected",
    group: "Class box",
    name: "Protected",
    glyph: "text:#",
    meaning: "`#` means **protected**: the class and its subclasses may use it, nobody else. Python marks this by convention only (single underscore); Scala has `protected`.",
    code: {
      python: `class Shape:
    def _describe(self) -> str:  # # describe(): str
        return "shape"`,
      scala: `class Shape:
  protected def describe: String = "shape"`,
    },
  },
  {
    id: "package",
    group: "Class box",
    name: "Package",
    glyph: "text:~",
    meaning: "`~` means **package** visibility: code in the same package (module) may use it. Python has no keyword for this; Scala writes `private[pkg]`.",
    code: {
      python: `# shop/cart.py: used by other modules in shop/ only, by agreement
def _recalculate(total: float) -> float:
    return round(total, 2)`,
      scala: `package shop

class Cart:
  private[shop] def recalculate(total: Double): Double = total`,
    },
  },
  {
    id: "static",
    group: "Class box",
    name: "Static (underlined)",
    glyph: "text:c̲o̲u̲n̲t̲",
    meaning: "An **underlined** member belongs to the class, not to each object: one shared copy. Python uses a class attribute or `@staticmethod`; Scala puts it in the companion `object`.",
    code: {
      python: `class Ticket:
    count = 0  # shared by all tickets

    @staticmethod
    def next_id() -> int:
        Ticket.count += 1
        return Ticket.count`,
      scala: `class Ticket

object Ticket:
  private var count = 0
  def nextId(): Int =
    count += 1
    count`,
    },
  },
  {
    id: "abstract",
    group: "Class box",
    name: "Abstract class",
    glyph: "box:abstract",
    meaning: "An **italic** name (or `{abstract}`) means you can't create the class directly; subclasses fill in the italic (abstract) operations. It can still hold shared code.",
    code: {
      python: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...`,
      scala: `abstract class Shape:
  def area: Double`,
    },
  },
  {
    id: "interface",
    group: "Class box",
    name: "Interface",
    glyph: "box:interface",
    meaning: "`«interface»` above the name: a list of operations with no data. Classes **realize** it by providing every operation. Python uses `Protocol` or an ABC; Scala uses a `trait`.",
    code: {
      python: `from typing import Protocol

class Payment(Protocol):
    def pay(self, amount: float) -> None: ...`,
      scala: `trait Payment:
  def pay(amount: Double): Unit`,
    },
  },
  {
    id: "enum",
    group: "Class box",
    name: "Enumeration",
    glyph: "box:enum",
    meaning: "`«enumeration»` above the name: a type with a fixed list of named values, written in the middle part. Use it when a value can only be one of a few choices.",
    code: {
      python: `from enum import Enum

class Size(Enum):
    SMALL = 1
    LARGE = 2`,
      scala: `enum Size:
  case Small, Large`,
    },
  },
  {
    id: "stereotype",
    group: "Class box",
    name: "Stereotype",
    glyph: "text:«entity»",
    meaning: "Words in guillemets `« »` add a label that says what kind of thing a class is, such as `«entity»`, `«service»` or `«singleton»`. It is a hint for the reader; the code may show it with a comment, decorator or naming.",
    code: {
      python: `from dataclasses import dataclass

@dataclass
class Customer:  # «entity»
    id: int
    name: str`,
      scala: `// «entity»
case class Customer(id: Int, name: String)`,
    },
  },
  {
    id: "attribute",
    group: "Class box",
    name: "Attribute syntax",
    glyph: "text:- name: Type",
    meaning: "An attribute reads `visibility name: Type`, for example `- balance: float`. The name comes first and the type after a colon, the same order as Python type hints and Scala.",
    code: {
      python: `class Account:
    def __init__(self) -> None:
        self._balance: float = 0.0  # - balance: float`,
      scala: `class Account:
  private var balance: Double = 0.0`,
    },
  },
  {
    id: "operation",
    group: "Class box",
    name: "Operation syntax",
    glyph: "text:+ op(p: T): R",
    meaning: "An operation reads `visibility name(param: Type): ReturnType`, for example `+ deposit(amount: float): None`. Leave the return type off when it returns nothing.",
    code: {
      python: `class Account:
    def deposit(self, amount: float) -> None:
        print(amount)`,
      scala: `class Account:
  def deposit(amount: Double): Unit = println(amount)`,
    },
  },
  {
    id: "default-value",
    group: "Class box",
    name: "Default value",
    glyph: "text:= 0",
    meaning: "`= value` after the type gives the starting value: `- retries: int = 3`. On a parameter it means the caller may leave it out.",
    code: {
      python: `class Client:
    def __init__(self, retries: int = 3) -> None:
        self.retries = retries`,
      scala: `class Client(val retries: Int = 3)`,
    },
  },
  {
    id: "derived",
    group: "Class box",
    name: "Derived attribute",
    glyph: "text:/age",
    meaning: "A slash `/` before the name means the value is **worked out** from other data, not stored. In code it is usually a property or a method with no parameters.",
    code: {
      python: `class Person:
    def __init__(self, born: int) -> None:
        self.born = born

    @property
    def age(self) -> int:  # /age
        return 2026 - self.born`,
      scala: `class Person(val born: Int):
  def age: Int = 2026 - born`,
    },
  },

  /* ---------------- Relationships ---------------- */
  {
    id: "association",
    group: "Relationships",
    name: "Association",
    glyph: "rel:association",
    meaning: "A solid line: one class **keeps a reference** to the other for a long time, usually as a field. Neither owns the other.",
    code: {
      python: `class Teacher:
    def __init__(self, school: "School") -> None:
        self.school = school  # kept as a field`,
      scala: `class School
class Teacher(val school: School)`,
    },
  },
  {
    id: "dependency",
    group: "Relationships",
    name: "Dependency",
    glyph: "rel:dependency",
    meaning: "A dashed line with an open arrow: one class **uses** the other briefly, as a parameter, a local variable or a return type, and does not keep it.",
    code: {
      python: `class Invoice:
    def print_with(self, printer: "Printer") -> None:
        printer.print("invoice")  # used, not kept`,
      scala: `class Printer:
  def print(text: String): Unit = println(text)
class Invoice:
  def printWith(p: Printer): Unit = p.print("invoice")`,
    },
  },
  {
    id: "aggregation",
    group: "Relationships",
    name: "Aggregation",
    glyph: "rel:aggregation",
    meaning: "A hollow diamond on the **whole**: the whole holds parts that were made elsewhere and can live on without it. A team has players; delete the team and the players remain.",
    code: {
      python: `class Team:
    def __init__(self, players: list["Player"]) -> None:
        self.players = players  # handed in from outside`,
      scala: `class Player
class Team(val players: List[Player])`,
    },
  },
  {
    id: "composition",
    group: "Relationships",
    name: "Composition",
    glyph: "rel:composition",
    meaning: "A filled diamond on the **whole**: the whole creates and owns its parts, and they die with it. A house and its rooms.",
    code: {
      python: `class House:
    def __init__(self) -> None:
        self.rooms = [Room(), Room()]  # created inside`,
      scala: `class Room
class House:
  private val rooms = List(Room(), Room())`,
    },
  },
  {
    id: "inheritance",
    group: "Relationships",
    name: "Inheritance",
    glyph: "rel:inheritance",
    meaning: "A solid line with a hollow triangle pointing at the **parent**: the child **is a** kind of the parent and gets its code.",
    code: {
      python: `class Animal: ...

class Dog(Animal): ...`,
      scala: `class Animal
class Dog extends Animal`,
    },
  },
  {
    id: "realization",
    group: "Relationships",
    name: "Realization",
    glyph: "rel:realization",
    meaning: "A dashed line with a hollow triangle pointing at the **interface**: the class promises to provide every operation the interface lists.",
    code: {
      python: `from typing import Protocol

class Payment(Protocol):
    def pay(self, amount: float) -> None: ...

class Card(Payment):
    def pay(self, amount: float) -> None:
        print(amount)`,
      scala: `trait Payment:
  def pay(amount: Double): Unit
class Card extends Payment:
  def pay(amount: Double): Unit = println(amount)`,
    },
  },
  {
    id: "navigability",
    group: "Relationships",
    name: "Navigability",
    glyph: "text:───>",
    meaning: "An open arrowhead on an association shows **which way you can go**: `Order ──> Customer` means an order knows its customer, but a customer does not hold its orders. No arrows means \"not decided\" or both ways.",
    code: {
      python: `class Customer: ...

class Order:
    def __init__(self, customer: Customer) -> None:
        self.customer = customer  # Order -> Customer only`,
      scala: `class Customer
class Order(val customer: Customer)`,
    },
  },
  {
    id: "role-name",
    group: "Relationships",
    name: "Role name",
    glyph: "text:+owner",
    meaning: "A word at the end of a line names the **role** the far class plays, and it usually becomes the field name: a line `Car ──> Person` with `+owner` at the Person end gives `car.owner`.",
    code: {
      python: `class Person: ...

class Car:
    def __init__(self, owner: Person) -> None:
        self.owner = owner  # role name = field name`,
      scala: `class Person
class Car(val owner: Person)`,
    },
  },

  /* ---------------- Multiplicity ---------------- */
  {
    id: "mult-one",
    group: "Multiplicity",
    name: "Exactly one",
    glyph: "text:1",
    meaning: "`1` at a line's end: **exactly one** object is always there. In code, a required field that is never `None`.",
    code: {
      python: `class Order:
    def __init__(self, customer: "Customer") -> None:
        self.customer = customer  # always set`,
      scala: `class Customer
class Order(val customer: Customer)`,
    },
  },
  {
    id: "mult-optional",
    group: "Multiplicity",
    name: "Zero or one",
    glyph: "text:0..1",
    meaning: "`0..1`: **optional**, at most one. Python writes `X | None`; Scala writes `Option[X]`.",
    code: {
      python: `class User:
    def __init__(self) -> None:
        self.manager: "User | None" = None`,
      scala: `class User:
  var manager: Option[User] = None`,
    },
  },
  {
    id: "mult-many",
    group: "Multiplicity",
    name: "Many",
    glyph: "text:*",
    meaning: "`*` (same as `0..*`): **any number**, including none. In code, a list, set or other collection that may be empty.",
    code: {
      python: `class Cart:
    def __init__(self) -> None:
        self.items: list[str] = []`,
      scala: `class Cart:
  var items: List[String] = Nil`,
    },
  },
  {
    id: "mult-one-or-more",
    group: "Multiplicity",
    name: "One or more",
    glyph: "text:1..*",
    meaning: "`1..*`: **at least one**. A collection that must never be empty, so the constructor checks it.",
    code: {
      python: `class Order:
    def __init__(self, lines: list[str]) -> None:
        if not lines:
            raise ValueError("an order needs a line")
        self.lines = lines`,
      scala: `class Order(val lines: List[String]):
  require(lines.nonEmpty, "an order needs a line")`,
    },
  },
  {
    id: "mult-range",
    group: "Multiplicity",
    name: "Range n..m",
    glyph: "text:2..4",
    meaning: "`n..m`: between **n and m** objects, for example a car has `2..4` doors. Code checks both limits.",
    code: {
      python: `class Car:
    def __init__(self, doors: list[str]) -> None:
        assert 2 <= len(doors) <= 4
        self.doors = doors`,
      scala: `class Car(val doors: List[String]):
  require(doors.size >= 2 && doors.size <= 4)`,
    },
  },

  /* ---------------- Sequence ---------------- */
  {
    id: "lifeline",
    group: "Sequence",
    name: "Lifeline",
    glyph: "text:obj:Class",
    meaning: "A box at the top (`name: Class`) with a dashed line down: one object taking part in the conversation. Time runs down the page.",
    code: {
      python: `cart = Cart()  # cart: Cart
payment = CardPayment()  # payment: CardPayment`,
      scala: `val cart = Cart()
val payment = CardPayment()`,
    },
  },
  {
    id: "sync-call",
    group: "Sequence",
    name: "Synchronous call",
    glyph: "text:──▶",
    meaning: "A solid line with a filled arrowhead: the caller **calls a method and waits** for it to finish. This is an ordinary method call.",
    code: {
      python: `total = cart.total()  # the caller waits here until total() returns`,
      scala: `val total = cart.total()`,
    },
  },
  {
    id: "return",
    group: "Sequence",
    name: "Return",
    glyph: "text:◀┄┄",
    meaning: "A dashed line with an open arrowhead going back: the **answer** coming back from a call. Often left out when nothing interesting is returned.",
    code: {
      python: `def total(self) -> float:
    return sum(self.prices)  # the dashed return arrow`,
      scala: `def total(): Double =
  prices.sum`,
    },
  },
  {
    id: "create",
    group: "Sequence",
    name: "Create",
    glyph: "text:«create»",
    meaning: "A call labelled `«create»` (or `new`) whose arrow hits the new object's box, drawn lower down because it starts to exist only then.",
    code: {
      python: `receipt = Receipt(order)  # «create»`,
      scala: `val receipt = Receipt(order)`,
    },
  },
  {
    id: "self-call",
    group: "Sequence",
    name: "Self-call",
    glyph: "text:↻",
    meaning: "An arrow that loops back to the same lifeline: the object **calls one of its own methods**, usually a private helper.",
    code: {
      python: `def checkout(self) -> None:
    self._apply_discount()  # self-call`,
      scala: `def checkout(): Unit =
  applyDiscount()`,
    },
  },
  {
    id: "activation",
    group: "Sequence",
    name: "Activation bar",
    glyph: "text:▮",
    meaning: "A thin box on a lifeline: the time when the object is **busy running a method**. It starts when a call arrives and ends when it returns.",
    code: {
      python: `def pay(self, amount: float) -> bool:
    # activation bar: from here...
    ok = self.bank.charge(amount)
    return ok  # ...to here`,
      scala: `def pay(amount: Double): Boolean =
  val ok = bank.charge(amount)
  ok`,
    },
  },

  /* ---------------- State & activity ---------------- */
  {
    id: "initial",
    group: "State & activity",
    name: "Initial node",
    glyph: "flow:initial",
    meaning: "A filled black dot: where the flow or the object's life **starts**. Exactly one arrow leaves it.",
    code: {
      python: `class Order:
    def __init__(self) -> None:
        self.state = "new"  # first state after the dot`,
      scala: `class Order:
  var state = "new"`,
    },
  },
  {
    id: "final",
    group: "State & activity",
    name: "Final node",
    glyph: "flow:final",
    meaning: "A bullseye (dot in a ring): the flow **ends** here, or the object reaches a state it never leaves.",
  },
  {
    id: "state",
    group: "State & activity",
    name: "State",
    glyph: "flow:state",
    meaning: "A rounded box: a **situation** an object stays in until something happens, such as `Paid` or `Shipped`. In code it is often an enum value.",
    code: {
      python: `from enum import Enum

class OrderState(Enum):
    NEW = 1
    PAID = 2
    SHIPPED = 3`,
      scala: `enum OrderState:
  case New, Paid, Shipped`,
    },
  },
  {
    id: "transition",
    group: "State & activity",
    name: "Transition label",
    glyph: "text:evt [g] / act",
    meaning: "An arrow between states labelled `event [guard] / action`: when the **event** happens and the **guard** is true, do the **action** and move. Each part is optional.",
    code: {
      python: `def pay(self, amount: float) -> None:  # event: pay
    if self.state == "new" and amount >= self.total:  # [guard]
        self.send_receipt()  # / action
        self.state = "paid"`,
      scala: `def pay(amount: Double): Unit =
  if state == "new" && amount >= total then
    sendReceipt()
    state = "paid"`,
    },
  },
  {
    id: "decision",
    group: "State & activity",
    name: "Decision / merge",
    glyph: "flow:decision",
    meaning: "A diamond: one way in and several ways out, each with a `[guard]`; exactly one path is taken. The same diamond with several ways in and one out **merges** paths again.",
    code: {
      python: `if stock > 0:  # [in stock]
    ship()
else:  # [out of stock]
    refund()`,
      scala: `if stock > 0 then ship()
else refund()`,
    },
  },
  {
    id: "fork-join",
    group: "State & activity",
    name: "Fork / join",
    glyph: "flow:fork",
    meaning: "A thick bar. A **fork** splits one flow into paths that run at the same time; a **join** waits until all of them are done before going on.",
    code: {
      python: `from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor() as pool:  # fork
    a = pool.submit(pack)
    b = pool.submit(print_label)
    a.result(); b.result()  # join`,
      scala: `import scala.concurrent.{Await, Future}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.Duration

val both = Future(pack()).zip(Future(printLabel()))
Await.result(both, Duration.Inf)`,
    },
  },
  {
    id: "action",
    group: "State & activity",
    name: "Action",
    glyph: "flow:action",
    meaning: "A rounded box in an activity diagram: one **step of work**, such as `Check stock`. It runs and then the flow moves on (a state, by contrast, waits).",
    code: {
      python: `check_stock(order)  # one action
take_payment(order)  # the next action`,
      scala: `checkStock(order)
takePayment(order)`,
    },
  },

  /* ---------------- Use case ---------------- */
  {
    id: "actor",
    group: "Use case",
    name: "Actor",
    glyph: "flow:actor",
    meaning: "A stick figure: someone or something **outside the system** that uses it, such as a customer, an admin or another system. It is a role, not a person.",
  },
  {
    id: "usecase",
    group: "Use case",
    name: "Use case",
    glyph: "flow:usecase",
    meaning: "An ellipse with a verb phrase, such as `Place order`: one **goal** an actor reaches with the system. In code it often becomes one service method.",
    code: {
      python: `class OrderService:
    def place_order(self, cart: list[str]) -> None:  # use case
        print("placed", cart)`,
      scala: `class OrderService:
  def placeOrder(cart: List[String]): Unit = println(cart)`,
    },
  },
  {
    id: "boundary",
    group: "Use case",
    name: "System boundary",
    glyph: "flow:boundary",
    meaning: "A rectangle with the system's name at the top: use cases go **inside**, actors stay **outside**. It shows what you are building and what you are not.",
  },
  {
    id: "include",
    group: "Use case",
    name: "«include»",
    glyph: "text:«include»",
    meaning: "A dashed arrow labelled `«include»` from a use case to another it **always** uses, such as `Place order` → `Log in`. Like a method that always calls a helper.",
    code: {
      python: `def place_order(self, user: str) -> None:
    self.log_in(user)  # always included
    print("placed")`,
      scala: `def placeOrder(user: String): Unit =
  logIn(user)
  println("placed")`,
    },
  },
  {
    id: "extend",
    group: "Use case",
    name: "«extend»",
    glyph: "text:«extend»",
    meaning: "A dashed arrow labelled `«extend»` from an **optional** use case to the base one it sometimes adds to, such as `Apply coupon` → `Place order`. Note the arrow points at the base.",
    code: {
      python: `def place_order(self, coupon: str | None) -> None:
    if coupon:  # extension point
        self.apply_coupon(coupon)
    print("placed")`,
      scala: `def placeOrder(coupon: Option[String]): Unit =
  coupon.foreach(applyCoupon)
  println("placed")`,
    },
  },
];

export default symbols;
