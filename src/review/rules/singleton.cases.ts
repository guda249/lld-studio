import type { ReviewCase } from "../cases";

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct get_instance() form with a lock (logger)",
    lang: "python",
    expect: { found: true, ids: ["singleton.shape", "singleton.one-access-point", "singleton.thread-safe", "singleton.global-state"], none: ["singleton.bypassed", "singleton.not-thread-safe"] },
    code: `import threading

class Logger:
    _instance: "Logger | None" = None
    _lock = threading.Lock()

    @classmethod
    def get_instance(cls) -> "Logger":
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
        return cls._instance

    def log(self, msg: str) -> None:
        print(msg)

Logger.get_instance().log("hello")
print(Logger.get_instance() is Logger.get_instance())`
  },
  {
    name: "2 Python, buggy: __init__ reruns and no lock while using threads",
    lang: "python",
    expect: { found: true, ids: ["singleton.init-reruns", "singleton.not-thread-safe"], none: ["singleton.thread-safe"] },
    code: `import threading

class Counter:
    _instance = None

    def __new__(cls) -> "Counter":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        self.count = 0

    def bump(self) -> None:
        self.count += 1

threads = [threading.Thread(target=lambda: Counter().bump()) for _ in range(4)]
for t in threads:
    t.start()
print(Counter().count)`
  },
  {
    name: "3 Python, buggy: accessor exists but the client calls the constructor",
    lang: "python",
    expect: { found: true, ids: ["singleton.bypassed"], none: ["singleton.one-access-point"] },
    code: `class Registry:
    _instance = None

    @staticmethod
    def instance() -> "Registry":
        if Registry._instance is None:
            Registry._instance = Registry()
        return Registry._instance

a = Registry.instance()
b = Registry()
print(a is b)`
  },
  {
    name: "4 Scala 3, correct: object used by services",
    lang: "scala",
    expect: { found: true, ids: ["singleton.one-instance", "singleton.thread-safe", "singleton.global-state"], none: ["singleton.public-ctor"] },
    code: `object FeatureFlags:
  private val flags = Map("darkMode" -> true)
  def isOn(name: String): Boolean = flags.getOrElse(name, false)

class Navbar:
  def theme(): String = if FeatureFlags.isOn("darkMode") then "dark" else "light"

@main def demo(): Unit =
  println(Navbar().theme())`
  },
  {
    name: "5 Scala 3, buggy: companion holds the instance but the constructor is public",
    lang: "scala",
    expect: { found: true, ids: ["singleton.public-ctor"], none: ["singleton.one-instance"] },
    code: `class Pool(val size: Int):
  def describe(): String = s"pool of $size"

object Pool:
  val instance: Pool = Pool(4)

@main def demo(): Unit =
  val extra = Pool(8)
  println(Pool.instance.describe())
  println(extra.describe())`
  },
  {
    name: "6 Scala 3, not Singleton: a new config per service",
    lang: "scala",
    expect: { found: false, ids: ["singleton.no-shape", "singleton.many-instances"] },
    code: `class Config:
  val region: String = "ap-south-1"

@main def demo(): Unit =
  val a = Config()
  val b = Config()
  println(a eq b)`
  },
];

export default cases;
