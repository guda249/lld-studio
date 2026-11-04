import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

const diagram: UmlModel = {"classes":[{"id":"Validator","name":"Validator","kind":"concrete","members":[]},{"id":"NotEmpty","name":"NotEmpty","kind":"concrete","members":[]},{"id":"MaxLength","name":"MaxLength","kind":"concrete","members":[]}],"relations":[{"id":"b","from":"NotEmpty","to":"Validator","type":"association"},{"id":"c","from":"MaxLength","to":"Validator","type":"inheritance"}]};

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct with set_next (different domain)",
    lang: "python",
    expect: {"found":true,"ids":["chain-of-responsibility.forwards","chain-of-responsibility.client-builds","chain-of-responsibility.end-of-chain"],"none":["chain-of-responsibility.creates-next","chain-of-responsibility.no-forwarding"]},
    code: `from abc import ABC, abstractmethod


class Validator(ABC):
    def __init__(self) -> None:
        self._next: "Validator | None" = None

    def set_next(self, nxt: "Validator") -> "Validator":
        self._next = nxt
        return nxt

    def check(self, text: str) -> str:
        problem = self.find_problem(text)
        if problem:
            return problem
        if self._next is None:
            return "ok"
        return self._next.check(text)

    @abstractmethod
    def find_problem(self, text: str) -> str | None: ...


class NotEmpty(Validator):
    def find_problem(self, text: str) -> str | None:
        return "empty" if not text else None


class MaxLength(Validator):
    def find_problem(self, text: str) -> str | None:
        return "too long" if len(text) > 20 else None


chain = NotEmpty()
chain.set_next(MaxLength())
print(chain.check("hello"))`
  },
  {
    name: "2 Scala 3, buggy: handler creates its own next, typed concretely, never forwards",
    lang: "scala",
    expect: {"found":true,"ids":["chain-of-responsibility.creates-next","chain-of-responsibility.concrete-next","chain-of-responsibility.no-forwarding"]},
    code: `trait Logger:
  def log(level: Int, msg: String): Unit

class ConsoleLogger extends Logger:
  private val next: FileLogger = FileLogger()
  def log(level: Int, msg: String): Unit =
    println(s"console: $msg")

class FileLogger extends Logger:
  def log(level: Int, msg: String): Unit =
    println(s"file: $msg")

@main def demo(): Unit =
  ConsoleLogger().log(1, "hi")`
  },
  {
    name: "3 Scala 3, correct with Option and foreach (different names)",
    lang: "scala",
    expect: {"found":true,"ids":["chain-of-responsibility.forwards","chain-of-responsibility.next-is-abstract","chain-of-responsibility.client-builds"],"none":["chain-of-responsibility.creates-next","chain-of-responsibility.concrete-next"]},
    code: `trait Middleware(next: Option[Middleware]):
  def accepts(path: String): Boolean
  def serve(path: String): String =
    if accepts(path) then s"served $path"
    else next.map(_.serve(path)).getOrElse("404")

class StaticFiles(next: Option[Middleware] = None) extends Middleware(next):
  def accepts(path: String): Boolean = path.startsWith("/static")

class Api(next: Option[Middleware] = None) extends Middleware(next):
  def accepts(path: String): Boolean = path.startsWith("/api")

@main def demo(): Unit =
  val chain = StaticFiles(Some(Api()))
  println(chain.serve("/api/users"))`
  },
  {
    name: "4 Python, not a chain (one class with if/elif)",
    lang: "python",
    expect: {"found":false,"ids":["chain-of-responsibility.no-shape","chain-of-responsibility.branches"]},
    code: `class Support:
    def handle(self, topic: str) -> str:
        if topic == "password":
            return "chatbot"
        elif topic == "refund":
            return "agent"
        elif topic == "bug":
            return "engineer"
        return "nobody"


print(Support().handle("bug"))`
  },
  {
    name: "5 Python, recognisable with a diagram that disagrees",
    lang: "python",
    diagram,
    expect: {"found":true,"ids":["chain-of-responsibility.forwards","uml.rel-type"]},
    code: `class Validator:
    def __init__(self, nxt: "Validator | None" = None) -> None:
        self.nxt = nxt

    def check(self, text: str) -> str:
        if self.nxt is None:
            return "ok"
        return self.nxt.check(text)


class NotEmpty(Validator):
    def check(self, text: str) -> str:
        return "empty" if not text else super().check(text)


class MaxLength(Validator):
    def check(self, text: str) -> str:
        return "too long" if len(text) > 20 else super().check(text)


print(NotEmpty(MaxLength()).check("hi"))`
  }
];

export default cases;
