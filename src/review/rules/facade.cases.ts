import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

/** The learner drew the services as composition (owned, made inside), but the code passes them in. */
const diagram: UmlModel = {"classes":[{"id":"TripFacade","name":"TripFacade","kind":"concrete","members":[]},{"id":"FlightDesk","name":"FlightDesk","kind":"concrete","members":[]},{"id":"HotelDesk","name":"HotelDesk","kind":"concrete","members":[]}],"relations":[{"id":"a","from":"TripFacade","to":"FlightDesk","type":"composition"},{"id":"b","from":"TripFacade","to":"HotelDesk","type":"composition"}]};

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct in another domain (facade makes its own devices)",
    lang: "python",
    expect: {"found":true,"ids":["facade.shape","facade.creates-subsystem","facade.subsystem-independent","facade.coordinates-only","facade.small-surface"],"none":["facade.client-bypasses","facade.business-logic","facade.leaks-subsystem"]},
    code: `class Lights:
    def dim(self, level: int) -> None:
        print(f"lights {level}%")


class Projector:
    def on(self) -> None:
        print("projector on")


class SoundBar:
    def surround(self) -> None:
        print("surround on")


class HomeTheater:
    def __init__(self) -> None:
        self.lights = Lights()
        self.projector = Projector()
        self.sound = SoundBar()

    def watch_movie(self) -> None:
        self.lights.dim(10)
        self.projector.on()
        self.sound.surround()


HomeTheater().watch_movie()`
  },
  {
    name: "2 Scala 3, buggy: subsystem points back at the facade, facade holds rules",
    lang: "scala",
    expect: {"found":true,"ids":["facade.subsystem-knows-facade","facade.business-logic"],"none":["facade.subsystem-independent","facade.coordinates-only"]},
    code: `class SeatLock:
  var booking: BookingDesk = null
  def lock(seats: List[String]): Boolean = true

class Gateway:
  def pay(user: String, amount: Int): Boolean = amount > 0

class BookingDesk(seats: SeatLock, gateway: Gateway):
  def book(user: String, kind: String, list: List[String]): String =
    if !seats.lock(list) then "taken"
    else
      val price = kind match
        case "gold" => 500
        case "silver" => 300
        case _ => 150
      if gateway.pay(user, price * list.size) then "ok" else "failed"

@main def demo(): Unit =
  println(BookingDesk(SeatLock(), Gateway()).book("asha", "gold", List("F7")))`
  },
  {
    name: "3 Scala 3, facade exists but the client still runs the flow and pulls a service out",
    lang: "scala",
    expect: {"found":true,"ids":["facade.client-bypasses","facade.leaks-subsystem"]},
    code: `class PanCheck:
  def verify(pan: String): Boolean = pan.length == 10

class Bureau:
  def score(pan: String): Int = 750

class Onboarding(pan: PanCheck, bureau: Bureau):
  def open(id: String): Boolean = pan.verify(id) && bureau.score(id) > 600
  def bureauService: Bureau = bureau

@main def demo(): Unit =
  val p = PanCheck()
  val b = Bureau()
  val facade = Onboarding(p, b)
  println(facade.open("ABCDE1234F"))
  if p.verify("XYZ") then println(b.score("XYZ"))`
  },
  {
    name: "4 Python, not a facade: the controller orchestrates every service",
    lang: "python",
    expect: {"found":false,"ids":["facade.no-shape","facade.client-choreography"]},
    code: `class Fridge:
    def cool(self) -> None: ...

class Oven:
    def heat(self) -> None: ...

class Fan:
    def spin(self) -> None: ...

def dinner_mode() -> None:
    Fridge().cool()
    Oven().heat()
    Fan().spin()

dinner_mode()`
  },
  {
    name: "5 Python, holds the services but never coordinates them",
    lang: "python",
    expect: {"found":false,"ids":["facade.no-coordination"]},
    code: `class Flights:
    def book(self) -> str: return "F1"

class Hotels:
    def book(self) -> str: return "H1"

class Trip:
    def __init__(self, flights: Flights, hotels: Hotels) -> None:
        self.flights = flights
        self.hotels = hotels`
  },
  {
    name: "6 Python, diagram shows composition but the code injects the services",
    lang: "python",
    diagram,
    expect: {"found":true,"ids":["facade.shape","uml.rel-type"]},
    code: `class FlightDesk:
    def book(self, city: str) -> str:
        return f"FL-{city}"


class HotelDesk:
    def reserve(self, city: str) -> str:
        return f"HT-{city}"


class TripFacade:
    def __init__(self, flights: FlightDesk, hotels: HotelDesk) -> None:
        self._flights = flights
        self._hotels = hotels

    def plan(self, city: str) -> str:
        return self._flights.book(city) + " " + self._hotels.reserve(city)


print(TripFacade(FlightDesk(), HotelDesk()).plan("Goa"))`
  },
  {
    name: "7 Scala 3, idiomatic object form",
    lang: "scala",
    expect: {"found":true,"ids":["facade.shape","facade.object-form"]},
    code: `object Kyc:
  private def pan(id: String): Boolean = id.nonEmpty
  private def otp(code: String): Boolean = code == "1234"
  def onboard(id: String, code: String): Boolean = pan(id) && otp(code)

@main def demo(): Unit = println(Kyc.onboard("A1", "1234"))`
  }
];

export default cases;
