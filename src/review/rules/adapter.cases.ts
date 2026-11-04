import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

// The learner drew the adapter as inheriting from the sensor (wrong) instead of holding it.
const diagram: UmlModel = {
  classes: [
    { id: "Thermometer", name: "Thermometer", kind: "interface", members: [] },
    { id: "FahrenheitSensor", name: "FahrenheitSensor", kind: "concrete", members: [] },
    { id: "SensorAdapter", name: "SensorAdapter", kind: "concrete", members: [] },
    { id: "Dashboard", name: "Dashboard", kind: "concrete", members: [] }
  ],
  relations: [
    { id: "a", from: "SensorAdapter", to: "Thermometer", type: "realization" },
    { id: "b", from: "SensorAdapter", to: "FahrenheitSensor", type: "inheritance" },
    { id: "c", from: "Dashboard", to: "Thermometer", type: "association" }
  ]
};

const sensorPy = `from abc import ABC, abstractmethod

class Thermometer(ABC):
    @abstractmethod
    def celsius(self) -> float: ...

class FahrenheitSensor:
    def read_f(self) -> float:
        return 98.6

class SensorAdapter(Thermometer):
    def __init__(self, sensor: FahrenheitSensor) -> None:
        self._sensor = sensor

    def celsius(self) -> float:
        return (self._sensor.read_f() - 32) * 5 / 9

class Dashboard:
    def __init__(self, thermo: Thermometer) -> None:
        self.thermo = thermo

    def show(self) -> str:
        return f"{self.thermo.celsius():.1f} C"

print(Dashboard(SensorAdapter(FahrenheitSensor())).show())`;

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct with other names (sensor units)",
    lang: "python",
    expect: { found: true, ids: ["adapter.shape", "adapter.translates", "adapter.adaptee-injected", "adapter.client-uses-target"], none: ["adapter.no-forwarding", "adapter.creates-adaptee", "adapter.client-bypasses"] },
    code: sensorPy
  },
  {
    name: "2 Python, correct code but the diagram shows inheritance instead of holding",
    lang: "python",
    diagram,
    expect: { found: true, ids: ["adapter.translates", "uml.rel-type"] },
    code: sensorPy
  },
  {
    name: "3 Scala 3, buggy: adapter creates the adaptee, forgets a method, client holds the adaptee",
    lang: "scala",
    expect: { found: true, ids: ["adapter.creates-adaptee", "adapter.missing-method", "adapter.client-bypasses"], none: ["adapter.adaptee-injected"] },
    code: `trait Notifier:
  def send(to: String, text: String): Unit
  def sendBulk(to: List[String], text: String): Unit

class SmsVendorSdk:
  def pushSms(msisdn: String, body: String, priority: Int): Int = 200

class SmsAdapter extends Notifier:
  private val sdk = SmsVendorSdk()
  def send(to: String, text: String): Unit = sdk.pushSms(to, text, 1)

class Alerts(vendor: SmsVendorSdk):
  def fire(): Unit = vendor.pushSms("999", "disk full", 2)`
  },
  {
    name: "4 Scala 3, buggy: adapter holds the adaptee but never calls it",
    lang: "scala",
    expect: { found: true, ids: ["adapter.no-forwarding"], none: ["adapter.translates"] },
    code: `trait Ranking:
  def topScores(n: Int): List[Int]

class OldLeaderboard:
  def fetchAll(): Array[Int] = Array(3, 9, 4)

class LeaderboardAdapter(board: OldLeaderboard) extends Ranking:
  def topScores(n: Int): List[Int] = List.empty

class Screen(ranking: Ranking):
  def render(): String = ranking.topScores(3).mkString(", ")`
  },
  {
    name: "5 Python, lighter form: a closure adapter",
    lang: "python",
    expect: { found: true, ids: ["adapter.function-form"], none: ["adapter.no-shape"] },
    code: `from collections.abc import Callable

Celsius = Callable[[], float]

class FahrenheitSensor:
    def read_f(self) -> float:
        return 98.6

def celsius_from(sensor: FahrenheitSensor) -> Celsius:
    def read() -> float:
        return (sensor.read_f() - 32) * 5 / 9
    return read

print(celsius_from(FahrenheitSensor())())`
  },
  {
    name: "6 Python, not Adapter: every caller talks to the SDK directly",
    lang: "python",
    expect: { found: false, ids: ["adapter.no-shape", "adapter.direct-calls"] },
    code: `class MapsSdk:
    def geocode_v2(self, query: str, fmt: str) -> dict[str, float]:
        return {"lat": 12.9, "lng": 77.6}

sdk = MapsSdk()

def store_location(name: str) -> float:
    return sdk.geocode_v2(name, "json")["lat"]

def delivery_zone(name: str) -> float:
    return sdk.geocode_v2(name, "json")["lng"]`
  },
];

export default cases;
