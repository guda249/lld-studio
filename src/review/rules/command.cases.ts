import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

const diagram: UmlModel = {"classes":[{"id":"Order","name":"Order","kind":"concrete","members":[]},{"id":"Action","name":"Action","kind":"interface","members":[]},{"id":"AddItem","name":"AddItem","kind":"concrete","members":[]},{"id":"ApplyCoupon","name":"ApplyCoupon","kind":"concrete","members":[]},{"id":"Cart","name":"Cart","kind":"concrete","members":[]}],"relations":[{"id":"a","from":"AddItem","to":"Action","type":"inheritance"},{"id":"b","from":"ApplyCoupon","to":"Action","type":"realization"},{"id":"c","from":"Cart","to":"Action","type":"aggregation"}]};

const cases: ReviewCase[] = [
  {
    name: "1 Scala 3, correct (different domain and names)",
    lang: "scala",
    diagram,
    expect: {"found":true,"ids":["command.invoker-runs","command.invoker-decoupled","command.undo","command.history","command.receiver","uml.rel-type"],"none":["command.no-history","command.undo-missing"]},
    code: `class Order:
  var items: List[String] = Nil
  var discount: Int = 0

trait Action:
  def perform(): Unit
  def undo(): Unit

class AddItem(order: Order, item: String) extends Action:
  def perform(): Unit = order.items = item :: order.items
  def undo(): Unit = order.items = order.items.tail

class ApplyCoupon(order: Order, percent: Int) extends Action:
  private var before = 0
  def perform(): Unit =
    before = order.discount
    order.discount = percent
  def undo(): Unit = order.discount = before

class Cart:
  private var done: List[Action] = Nil
  def submit(a: Action): Unit =
    a.perform()
    done = a :: done
  def undoLast(): Unit = done match
    case last :: rest =>
      last.undo()
      done = rest
    case Nil => ()

@main def demo(): Unit =
  val order = Order()
  val cart = Cart()
  cart.submit(AddItem(order, "pen"))
  cart.submit(ApplyCoupon(order, 10))
  cart.undoLast()`
  },
  {
    name: "2 Python, buggy: invoker creates and type-checks commands, one command can't undo, no history",
    lang: "python",
    expect: {"found":true,"ids":["command.invoker-creates","command.type-check","command.undo-missing","command.no-history"],"none":["command.invoker-decoupled"]},
    code: `from abc import ABC, abstractmethod


class Light:
    def __init__(self) -> None:
        self.on = False


class Command(ABC):
    @abstractmethod
    def execute(self) -> None: ...

    @abstractmethod
    def undo(self) -> None: ...


class TurnOn(Command):
    def __init__(self, light: Light) -> None:
        self.light = light

    def execute(self) -> None:
        self.light.on = True

    def undo(self) -> None:
        self.light.on = False


class TurnOff(Command):
    def __init__(self, light: Light) -> None:
        self.light = light

    def execute(self) -> None:
        self.light.on = False


class Remote:
    def __init__(self, light: Light) -> None:
        self.light = light

    def press(self, command: Command) -> None:
        if isinstance(command, TurnOff):
            print("turning off")
        command.execute()

    def press_on(self) -> None:
        TurnOn(self.light).execute()


remote = Remote(Light())
remote.press_on()`
  },
  {
    name: "3 Python, commands without an invoker",
    lang: "python",
    expect: {"found":true,"ids":["command.no-invoker","command.receiver"]},
    code: `from abc import ABC, abstractmethod


class Account:
    def __init__(self) -> None:
        self.balance = 0


class Transaction(ABC):
    @abstractmethod
    def execute(self) -> None: ...


class Deposit(Transaction):
    def __init__(self, account: Account, amount: int) -> None:
        self.account = account
        self.amount = amount

    def execute(self) -> None:
        self.account.balance += self.amount


class Withdraw(Transaction):
    def __init__(self, account: Account, amount: int) -> None:
        self.account = account
        self.amount = amount

    def execute(self) -> None:
        self.account.balance -= self.amount


acc = Account()
Deposit(acc, 100).execute()
Withdraw(acc, 30).execute()`
  },
  {
    name: "4 Scala 3, not Command: the client calls the receiver directly",
    lang: "scala",
    expect: {"found":false,"ids":["command.no-shape","command.direct-calls"]},
    code: `class Player:
  var x = 0
  def left(): Unit = x -= 1
  def right(): Unit = x += 1

@main def demo(): Unit =
  val p = Player()
  p.right()
  p.right()
  p.left()
  println(p.x)`
  },
  {
    name: "5 Python, function form (no undo)",
    lang: "python",
    expect: {"found":true,"ids":["command.functional"]},
    code: `from typing import Callable


def greet(name: str) -> Callable[[], None]:
    return lambda: print(f"hi {name}")


def bye(name: str) -> Callable[[], None]:
    return lambda: print(f"bye {name}")


todo = [greet("asha"), bye("ravi")]
for job in todo:
    job()`
  }
];

export default cases;
