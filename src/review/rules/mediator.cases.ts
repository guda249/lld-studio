import type { ReviewCase } from "../cases";

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct, other domain (smart home hub with named colleagues)",
    lang: "python",
    expect: {"found":true,"ids":["mediator.shape","mediator.depends-on-interface","mediator.no-direct-links","mediator.colleagues-send","mediator.routes"],"none":["mediator.colleague-knows-colleague","mediator.no-routing","mediator.colleague-knows-concrete-mediator"]},
    code: `from abc import ABC, abstractmethod

class Hub(ABC):
    @abstractmethod
    def notify(self, sender: str, event: str) -> None: ...

class Light:
    def __init__(self, hub: Hub) -> None:
        self.hub = hub
        self.on = False

    def switch(self, on: bool) -> None:
        self.on = on

class DoorSensor:
    def __init__(self, hub: Hub) -> None:
        self.hub = hub

    def opened(self) -> None:
        self.hub.notify("door", "opened")

class HomeHub(Hub):
    def __init__(self) -> None:
        self.light: Light | None = None
        self.door: DoorSensor | None = None

    def register(self, light: Light, door: DoorSensor) -> None:
        self.light = light
        self.door = door

    def notify(self, sender: str, event: str) -> None:
        if sender == "door" and event == "opened" and self.light:
            self.light.switch(True)

hub = HomeHub()
light, door = Light(hub), DoorSensor(hub)
hub.register(light, door)
door.opened()
print(light.on)`
  },
  {
    name: "2 Scala 3, buggy: colleague typed as the concrete mediator and holding a peer",
    lang: "scala",
    expect: {"found":true,"ids":["mediator.colleague-knows-concrete-mediator","mediator.colleague-knows-colleague"],"none":["mediator.no-direct-links","mediator.depends-on-interface"]},
    code: `import scala.collection.mutable

trait Tower:
  def requestLanding(p: Plane): Unit

class Plane(val callSign: String, tower: ControlTower):
  var wingman: Option[Plane] = None
  def land(): Unit = tower.requestLanding(this)
  def cleared(): Unit = println(s"$callSign cleared")

class ControlTower extends Tower:
  private val queue = mutable.Queue.empty[Plane]
  def requestLanding(p: Plane): Unit =
    queue.enqueue(p)
    queue.head.cleared()

@main def atc(): Unit =
  val t = ControlTower()
  val a = Plane("AI-101", t)
  a.land()`
  },
  {
    name: "3 Python, buggy: the mediator stores colleagues but never calls them",
    lang: "python",
    expect: {"found":true,"ids":["mediator.no-routing","mediator.no-interface"],"none":["mediator.routes"]},
    code: `class Bidder:
    def __init__(self, name: str, house: "AuctionHouse") -> None:
        self.name = name
        self.house = house

    def bid(self, amount: int) -> None:
        self.house.place(self, amount)

    def outbid(self, amount: int) -> None:
        print(self.name, "was outbid at", amount)

class AuctionHouse:
    def __init__(self) -> None:
        self.bidders: list[Bidder] = []
        self.best = 0

    def join(self, b: Bidder) -> None:
        self.bidders.append(b)

    def place(self, who: Bidder, amount: int) -> None:
        if amount > self.best:
            self.best = amount

house = AuctionHouse()
b = Bidder("asha", house)
house.join(b)
b.bid(100)`
  },
  {
    name: "4 Python, not Mediator: every player links to every other",
    lang: "python",
    expect: {"found":false,"ids":["mediator.no-shape","mediator.mesh"]},
    code: `class Player:
    def __init__(self, name: str) -> None:
        self.name = name
        self.friends: list["Player"] = []

    def befriend(self, other: "Player") -> None:
        self.friends.append(other)

    def shout(self, text: str) -> None:
        for f in self.friends:
            print(f.name, "heard", text)

a, b = Player("a"), Player("b")
a.befriend(b)
a.shout("hi")`
  },
  {
    name: "5 Scala 3, event bus (idiomatic form)",
    lang: "scala",
    expect: {"found":true,"ids":["mediator.event-bus"],"none":["mediator.no-shape"]},
    code: `import scala.collection.mutable

class Bus:
  private val handlers = mutable.Map.empty[String, mutable.ListBuffer[Int => Unit]]

  def on(topic: String, h: Int => Unit): Unit =
    handlers.getOrElseUpdate(topic, mutable.ListBuffer.empty) += h

  def emit(topic: String, value: Int): Unit =
    handlers.get(topic).foreach(_.foreach(h => h(value)))

@main def bus(): Unit =
  val b = Bus()
  b.on("score", n => println(s"score $n"))
  b.emit("score", 4)`
  }
];

export default cases;
