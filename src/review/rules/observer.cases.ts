import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

/** Diagram for case 5: draws "implements a trait" as plain inheritance (should be realization). */
const diagram: UmlModel = {"classes":[{"id":"WeatherStation","name":"WeatherStation","kind":"concrete","members":[]},{"id":"Listener","name":"Listener","kind":"interface","members":[]},{"id":"PhoneApp","name":"PhoneApp","kind":"concrete","members":[]},{"id":"Logger","name":"Logger","kind":"concrete","members":[]}],"relations":[{"id":"a","from":"WeatherStation","to":"Listener","type":"aggregation"},{"id":"b","from":"PhoneApp","to":"Listener","type":"inheritance"},{"id":"c","from":"Logger","to":"Listener","type":"realization"}]};

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct, other domain (Protocol, untyped list)",
    lang: "python",
    expect: {"found":true,"ids":["observer.shape","observer.depends-on-interface","observer.subscribe-unsubscribe","observer.notifies","observer.no-hardwired"],"none":["observer.no-unsubscribe","observer.manual-notify","observer.subject-knows-concrete"]},
    code: `from typing import Protocol

class Reader(Protocol):
    def on_issue(self, title: str) -> None: ...

class EmailReader:
    def on_issue(self, title: str) -> None:
        print("email:", title)

class SmsReader:
    def on_issue(self, title: str) -> None:
        print("sms:", title)

class Newsletter:
    def __init__(self):
        self.readers = []

    def join(self, reader: Reader) -> None:
        self.readers.append(reader)

    def leave(self, reader: Reader) -> None:
        self.readers.remove(reader)

    def publish(self, title: str) -> None:
        for r in list(self.readers):
            r.on_issue(title)

news = Newsletter()
news.join(EmailReader())
news.publish("Issue 1")`
  },
  {
    name: "2 Scala 3, buggy: subject creates an observer, no unsubscribe",
    lang: "scala",
    expect: {"found":true,"ids":["observer.subject-knows-concrete","observer.no-unsubscribe"],"none":["observer.no-hardwired"]},
    code: `import scala.collection.mutable

trait ScoreListener:
  def scored(team: String, runs: Int): Unit

class Scoreboard extends ScoreListener:
  def scored(team: String, runs: Int): Unit = println(s"$team: $runs")

class Commentary extends ScoreListener:
  def scored(team: String, runs: Int): Unit = println(s"What a shot by $team!")

class Match:
  private val listeners = mutable.ListBuffer[ScoreListener](Scoreboard())

  def addListener(l: ScoreListener): Unit = listeners += l

  def runsScored(team: String, runs: Int): Unit =
    listeners.foreach(_.scored(team, runs))

@main def cricket(): Unit =
  val m = Match()
  m.addListener(Commentary())
  m.runsScored("India", 4)`
  },
  {
    name: "3 Python, buggy: list of one concrete class, client must call notify",
    lang: "python",
    expect: {"found":true,"ids":["observer.concrete-observer-type","observer.manual-notify"],"none":["observer.depends-on-interface"]},
    code: `class Dashboard:
    def refresh(self, temp: float) -> None:
        print("temp is", temp)

class Thermostat:
    def __init__(self) -> None:
        self.temp = 20.0
        self.screens: list[Dashboard] = []

    def attach(self, d: Dashboard) -> None:
        self.screens.append(d)

    def detach(self, d: Dashboard) -> None:
        self.screens.remove(d)

    def set_temp(self, t: float) -> None:
        self.temp = t

    def notify_all(self) -> None:
        for s in self.screens:
            s.refresh(self.temp)

t = Thermostat()
t.attach(Dashboard())
t.set_temp(22.5)
t.notify_all()`
  },
  {
    name: "4 Scala 3, not Observer: hard-wired consumers",
    lang: "scala",
    expect: {"found":false,"ids":["observer.no-shape","observer.hardwired"]},
    code: `class Invoice:
  def bill(order: String): Unit = println(s"bill $order")

class Warehouse:
  def ship(order: String): Unit = println(s"ship $order")

class Shop:
  private val invoice = Invoice()
  private val warehouse = Warehouse()

  def placeOrder(order: String): Unit =
    invoice.bill(order)
    warehouse.ship(order)

@main def shop(): Unit = Shop().placeOrder("A-1")`
  },
  {
    name: "5 Scala 3, correct with an immutable list; diagram draws a realization as inheritance",
    lang: "scala",
    diagram,
    expect: {"found":true,"ids":["observer.depends-on-interface","observer.subscribe-unsubscribe","observer.notifies","uml.rel-type"],"none":["observer.no-unsubscribe","observer.manual-notify"]},
    code: `trait Listener:
  def changed(celsius: Double): Unit

class PhoneApp extends Listener:
  def changed(celsius: Double): Unit = println(s"Phone: $celsius")

class Logger extends Listener:
  def changed(celsius: Double): Unit = println(s"log $celsius")

class WeatherStation:
  private var listeners: List[Listener] = Nil

  def subscribe(l: Listener): Unit = listeners = l :: listeners
  def unsubscribe(l: Listener): Unit = listeners = listeners.filterNot(_ == l)

  def record(celsius: Double): Unit =
    listeners.foreach(_.changed(celsius))

@main def weather(): Unit =
  val ws = WeatherStation()
  ws.subscribe(PhoneApp())
  ws.subscribe(Logger())
  ws.record(31.5)`
  },
  {
    name: "6 Python, callbacks (idiomatic form)",
    lang: "python",
    expect: {"found":true,"ids":["observer.function-observers","observer.notifies"],"none":["observer.concrete-observer-type"]},
    code: `from collections.abc import Callable

class Button:
    def __init__(self) -> None:
        self._handlers: list[Callable[[], None]] = []

    def on_click(self, handler: Callable[[], None]) -> None:
        self._handlers.append(handler)

    def off_click(self, handler: Callable[[], None]) -> None:
        self._handlers.remove(handler)

    def click(self) -> None:
        for h in list(self._handlers):
            h()

b = Button()
b.on_click(lambda: print("clicked"))
b.click()`
  }
];

export default cases;
