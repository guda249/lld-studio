import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

/** The learner drew the proxy inheriting from the real image instead of realising the Image interface. */
const diagram: UmlModel = {"classes":[{"id":"Image","name":"Image","kind":"interface","members":[]},{"id":"HighResImage","name":"HighResImage","kind":"concrete","members":[]},{"id":"ImageProxy","name":"ImageProxy","kind":"concrete","members":[]}],"relations":[{"id":"a","from":"HighResImage","to":"Image","type":"realization"},{"id":"b","from":"ImageProxy","to":"HighResImage","type":"inheritance"}]};

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct in another domain (caching proxy over the interface)",
    lang: "python",
    expect: {"found":true,"ids":["proxy.shape","proxy.same-interface","proxy.controls"],"none":["proxy.no-control","proxy.client-concrete","proxy.method-not-forwarded"]},
    code: `from abc import ABC, abstractmethod


class Weather(ABC):
    @abstractmethod
    def today(self, city: str) -> str: ...


class WeatherApi(Weather):
    def today(self, city: str) -> str:
        return f"sunny in {city}"


class CachedWeather(Weather):
    def __init__(self, real: Weather) -> None:
        self._real = real
        self._seen: dict[str, str] = {}

    def today(self, city: str) -> str:
        if city not in self._seen:
            self._seen[city] = self._real.today(city)
        return self._seen[city]


def show(w: Weather) -> None:
    print(w.today("Pune"))


show(CachedWeather(WeatherApi()))`
  },
  {
    name: "2 Scala 3, buggy: pass-through proxy, eager creation, dead method, concrete client",
    lang: "scala",
    expect: {"found":true,"ids":["proxy.no-control","proxy.eager-real","proxy.method-not-forwarded","proxy.client-concrete"],"none":["proxy.lazy"]},
    code: `trait Vault:
  def open(pin: String): String
  def balance(): Int

class BankVault extends Vault:
  def open(pin: String): String = s"opened with $pin"
  def balance(): Int = 1000

class VaultProxy extends Vault:
  private val real = BankVault()
  def open(pin: String): String = real.open(pin)
  def balance(): Int = 0

def audit(v: VaultProxy): Unit = println(v.balance())

@main def demo(): Unit = audit(VaultProxy())`
  },
  {
    name: "3 Python, proxy forgets to implement the shared interface",
    lang: "python",
    diagram,
    expect: {"found":true,"ids":["proxy.no-shared-interface","proxy.lazy","uml.rel-type"]},
    code: `from abc import ABC, abstractmethod


class Image(ABC):
    @abstractmethod
    def show(self) -> str: ...


class HighResImage(Image):
    def __init__(self, path: str) -> None:
        self.path = path

    def show(self) -> str:
        return f"showing {self.path}"


class ImageProxy:
    def __init__(self, path: str) -> None:
        self._path = path
        self._real: HighResImage | None = None

    def show(self) -> str:
        if self._real is None:
            self._real = HighResImage(self._path)
        return self._real.show()


print(ImageProxy("goa.jpg").show())`
  },
  {
    name: "4 Scala 3, not a proxy: every caller guards the real class itself",
    lang: "scala",
    expect: {"found":false,"ids":["proxy.no-shape","proxy.callers-guard"]},
    code: `class Payroll:
  def salaries(): List[Int] = List(100, 200)

def hrView(p: Payroll, role: String): List[Int] =
  if role == "hr" then p.salaries() else Nil

def managerView(p: Payroll, role: String): List[Int] = p.salaries()

@main def demo(): Unit = println(hrView(Payroll(), "hr"))`
  },
  {
    name: "5 Scala 3, protection proxy written differently",
    lang: "scala",
    expect: {"found":true,"ids":["proxy.same-interface","proxy.controls"],"none":["proxy.no-control","proxy.eager-real","proxy.client-concrete"]},
    code: `trait Reports:
  def salaries(): List[Int]

class HrReports extends Reports:
  def salaries(): List[Int] = List(100, 200)

class GuardedReports(inner: Reports, role: String) extends Reports:
  def salaries(): List[Int] =
    if role != "hr" then throw IllegalStateException("HR only")
    inner.salaries()

def print(r: Reports): Unit = println(r.salaries())

@main def demo(): Unit = print(GuardedReports(HrReports(), "hr"))`
  }
];

export default cases;
