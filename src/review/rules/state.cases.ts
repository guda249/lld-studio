import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

/** The learner drew the states as associations instead of inheritance. */
const diagram: UmlModel = {"classes":[{"id":"Player","name":"Player","kind":"concrete","members":[]},{"id":"PlayerState","name":"PlayerState","kind":"abstract","members":[]},{"id":"Playing","name":"Playing","kind":"concrete","members":[]},{"id":"Paused","name":"Paused","kind":"concrete","members":[]}],"relations":[{"id":"a","from":"Player","to":"PlayerState","type":"aggregation"},{"id":"b","from":"Playing","to":"PlayerState","type":"association"},{"id":"c","from":"Paused","to":"PlayerState","type":"association"}]};

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct, other domain (ABC, states change the context)",
    lang: "python",
    expect: {"found":true,"ids":["state.shape","state.delegates","state.transitions-in-states","state.all-actions"],"none":["state.context-picks-next","state.no-transitions","state.missing-action"]},
    code: `from __future__ import annotations
from abc import ABC, abstractmethod

class TicketState(ABC):
    @abstractmethod
    def resolve(self, t: Ticket) -> None: ...
    @abstractmethod
    def reopen(self, t: Ticket) -> None: ...

class Open(TicketState):
    def resolve(self, t: Ticket) -> None:
        t.state = Resolved()
    def reopen(self, t: Ticket) -> None:
        print("already open")

class Resolved(TicketState):
    def resolve(self, t: Ticket) -> None:
        print("already resolved")
    def reopen(self, t: Ticket) -> None:
        t.state = Open()

class Ticket:
    def __init__(self) -> None:
        self.state: TicketState = Open()
    def resolve(self) -> None:
        self.state.resolve(self)
    def reopen(self) -> None:
        self.state.reopen(self)

t = Ticket()
t.resolve()
t.reopen()`
  },
  {
    name: "2 Python, buggy: the context picks the next state and a state misses an action",
    lang: "python",
    diagram,
    expect: {"found":true,"ids":["state.context-picks-next","state.missing-action","uml.rel-type"],"none":["state.transitions-in-states"]},
    code: `from abc import ABC, abstractmethod

class PlayerState(ABC):
    @abstractmethod
    def press_play(self) -> str: ...
    @abstractmethod
    def press_stop(self) -> str: ...

class Playing(PlayerState):
    def press_play(self) -> str: return "pause"
    def press_stop(self) -> str: return "stop"

class Paused(PlayerState):
    def press_play(self) -> str: return "resume"

class Player:
    def __init__(self) -> None:
        self.state: PlayerState = Paused()

    def play(self) -> None:
        self.state.press_play()
        self.state = Playing()

    def pause(self) -> None:
        self.state.press_play()
        self.state = Paused()`
  },
  {
    name: "3 Scala 3, correct (trait with refusing defaults, case objects)",
    lang: "scala",
    expect: {"found":true,"ids":["state.delegates","state.transitions-in-states","state.all-actions"],"none":["state.context-picks-next","state.missing-action","state.no-transitions"]},
    code: `sealed trait Light:
  def next: Light
  def label: String

case object Red extends Light:
  val label = "red"
  def next: Light = Green

case object Green extends Light:
  val label = "green"
  def next: Light = Yellow

case object Yellow extends Light:
  val label = "yellow"
  def next: Light = Red

class TrafficSignal:
  private var light: Light = Red
  def tick(): Unit = light = light.next
  def show: String = light.label

@main def demo(): Unit =
  val s = TrafficSignal()
  s.tick()
  println(s.show)`
  },
  {
    name: "4 Scala 3, buggy: no transitions (really Strategy) and a type match on the state",
    lang: "scala",
    expect: {"found":true,"ids":["state.no-transitions","state.context-checks-state"]},
    code: `trait Mood:
  def greet: String

class Happy extends Mood:
  def greet: String = "Hi!"

class Grumpy extends Mood:
  def greet: String = "What?"

class Person(private var mood: Mood):
  def talk(): String =
    mood match
      case _: Happy => mood.greet + " :)"
      case _: Grumpy => mood.greet + " :("
      case _ => mood.greet`
  },
  {
    name: "5 Python, not State: status string checked in every method",
    lang: "python",
    expect: {"found":false,"ids":["state.no-shape","state.status-checks"]},
    code: `class Door:
    def __init__(self) -> None:
        self.status = "closed"

    def open(self) -> None:
        if self.status == "closed":
            self.status = "open"

    def close(self) -> None:
        if self.status == "open":
            self.status = "closed"

    def lock(self) -> None:
        if self.status == "closed":
            self.status = "locked"`
  },
  {
    name: "6 Scala 3, states but no context",
    lang: "scala",
    expect: {"found":false,"ids":["state.no-context"]},
    code: `trait DoorState:
  def open: DoorState

case object Closed extends DoorState:
  def open: DoorState = Opened

case object Opened extends DoorState:
  def open: DoorState = Opened`
  }
];

export default cases;
