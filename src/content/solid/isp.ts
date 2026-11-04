import type { Guide } from "../guides/types";
import beforePy from "./code/isp-before.py?raw";
import beforeScala from "./code/isp-before.scala?raw";
import afterPy from "./code/isp-after.py?raw";
import afterScala from "./code/isp-after.scala?raw";

const guide: Guide = {
  section: "solid",
  id: "isp",
  order: 5,
  title: "I: Interface Segregation",
  short: "No class should be forced to depend on methods it does not use. Prefer small, focused interfaces.",
  lede:
    "The I in SOLID. When one interface tries to serve every kind of client, implementers must fake methods they can't support, " +
    "and clients end up tied to methods they never call. Split it by what each client needs.",
  blocks: [
    {
      type: "text",
      text:
        "Think of a TV remote. A child needs power, volume and channel; a universal remote with eighty buttons makes that simple job hard, and every extra button is a way to get it wrong. " +
        "An interface is a list of buttons. The **Interface Segregation Principle** (ISP) says: give each kind of client a small interface with just the buttons it uses. " +
        "One class may still implement several small interfaces, so nothing is lost."
    },
    {
      type: "compare",
      before: {
        title: "Before: one OfficeMachine for everything",
        text:
          "The change request: **buy cheap printers for the branch offices.** `BasicPrinter` must implement `OfficeMachine`, so it has to write `scan()` and `fax()` that only raise errors. " +
          "`print_payslips` only prints, yet it depends on all three methods: when the fax method's signature changes, the payslip code must be rebuilt and re-tested too.",
        code: { python: beforePy, scala: beforeScala },
        uml: {
          classes: [
            { name: "OfficeMachine", kind: "interface", members: ["+ print_doc(doc)", "+ scan(page)", "+ fax(number, doc)"] },
            { name: "MultiFunctionDevice", kind: "concrete", members: ["+ print_doc(doc)", "+ scan(page)", "+ fax(number, doc)"] },
            { name: "BasicPrinter", kind: "concrete", members: ["+ print_doc(doc)", "+ scan(page) ✗", "+ fax(number, doc) ✗"] }
          ],
          relations: [
            { from: "MultiFunctionDevice", to: "OfficeMachine", type: "realization" },
            { from: "BasicPrinter", to: "OfficeMachine", type: "realization" }
          ]
        }
      },
      after: {
        title: "After: Printer, Scanner and Fax",
        text:
          "Three one-job interfaces. `BasicPrinter` implements only `Printer`; `MultiFunctionDevice` implements all three. `print_payslips` asks for a `Printer`, and `archive` asks for a `Scanner`. " +
          "No fake methods, no surprise errors, and a change to faxing touches only the code that faxes.",
        code: { python: afterPy, scala: afterScala },
        uml: {
          classes: [
            { name: "Printer", kind: "interface", members: ["+ print_doc(doc)"] },
            { name: "Scanner", kind: "interface", members: ["+ scan(page)"] },
            { name: "Fax", kind: "interface", members: ["+ fax(number, doc)"] },
            { name: "BasicPrinter", kind: "concrete", members: ["+ print_doc(doc)"] },
            { name: "MultiFunctionDevice", kind: "concrete", members: ["+ print_doc(doc)", "+ scan(page)", "+ fax(number, doc)"] }
          ],
          relations: [
            { from: "BasicPrinter", to: "Printer", type: "realization" },
            { from: "MultiFunctionDevice", to: "Printer", type: "realization" },
            { from: "MultiFunctionDevice", to: "Scanner", type: "realization" },
            { from: "MultiFunctionDevice", to: "Fax", type: "realization" }
          ]
        }
      }
    },
    {
      type: "callout",
      tone: "tip",
      title: "ISP and LSP go together",
      text:
        "A method that only raises `NotImplementedError` breaks Liskov too: code holding an `OfficeMachine` can't trust a `BasicPrinter`. Fixing the fat interface (ISP) usually fixes the broken subtype (LSP) at the same time, as in lesson 4."
    },
    {
      type: "list",
      title: "How to spot it in code",
      style: "crosses",
      items: [
        "Implementations full of `raise NotImplementedError`, `pass`, `???` or empty bodies.",
        "An interface with ten or more methods, where each caller uses a different handful.",
        "Test fakes (mocks) that must stub many methods the test never touches.",
        "A change to one method's signature forces rebuilds or edits in clients that never call it.",
        "Names like `IEverything`, `Service`, `Manager` on an interface."
      ]
    },
    {
      type: "callout",
      tone: "warn",
      title: "When not to over-apply it",
      text:
        "Don't make one interface per method by habit. Group methods that **the same clients always use together**: `read` and `exists` usually belong in one `Reader`. " +
        "Split when a real client needs only part of an interface, or a real implementer can't support part of it. Twenty one-method interfaces are as hard to follow as one fat one."
    },
    {
      type: "callout",
      tone: "tip",
      title: "Small interfaces are cheap in both languages",
      text:
        "Python: an `ABC` with one abstract method, or a `typing.Protocol` (a class matches a Protocol just by having the methods, with no `extends`). Scala: a `trait` per role, mixed in with `extends Printer, Scanner, Fax`."
    },
    {
      type: "patterns",
      title: "Patterns that apply it",
      items: [
        { slug: "adapter", how: "Wrap a fat third-party SDK behind a small interface you own, with just the two methods your code calls." },
        { slug: "facade", how: "Give a client one narrow entry point instead of exposing every method of a large subsystem." },
        { slug: "proxy", how: "A proxy can expose a reduced, safer interface (read-only, say) to clients that should not see everything." }
      ]
    }
  ],
  quiz: [
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "A Repository interface has read, write and bulk_export. The reporting service only reads. What does ISP suggest?",
      options: [
        "Split out a Reader interface; the reporting service depends only on Reader",
        "Keep one interface; the reporting service can ignore the other methods",
        "Make the reporting service implement write and bulk_export",
        "Remove bulk_export from the codebase"
      ],
      answer: 0,
      hint: "What does the reporting service actually use?",
      explain:
        "A Reader (and perhaps Writer and Exporter) lets the reporting service depend only on reading, so export changes can't touch it. Ignoring methods still couples the client to them, the client should not implement anything, and deleting a feature is not a design fix."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "Which line is the clearest sign that this interface is too fat?",
      code: {
        lang: "python",
        text:
          "class Worker(ABC):\n    @abstractmethod\n    def work(self) -> str: ...\n    @abstractmethod\n    def eat_lunch(self) -> str: ...\n\n\nclass RobotArm(Worker):\n    def work(self) -> str:\n        return \"welding\"\n    def eat_lunch(self) -> str:\n        raise NotImplementedError(\"robots don't eat\")\n\n\nprint(RobotArm().work())"
      },
      answer: 12,
      hint: "Look for a method that exists only because the interface demands it.",
      explain:
        "Line 12 raises NotImplementedError: the robot is forced to have eat_lunch. Split Workable from a separate interface for lunch breaks, and let RobotArm implement only Workable."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "Which other SOLID principle is usually broken when a class raises an error for an interface method it can't support?",
      options: ["Liskov Substitution", "Single Responsibility", "Open/Closed", "Dependency Inversion"],
      answer: 0,
      hint: "Can that class stand in for the interface everywhere?",
      explain:
        "A class that refuses part of its interface can't be substituted for it safely, which is a Liskov violation. SRP is about reasons to change, OCP about adding behaviour without edits, and DIP about which way dependencies point."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "A teammate splits a FileStore interface into Opener, Reader, Closer and ExistsChecker. Every caller uses all four together. Good idea?",
      options: [
        "No: these methods are always used together, so one interface is clearer",
        "Yes: one method per interface is the rule",
        "Yes: more interfaces always mean less coupling",
        "No: interfaces should never have fewer than five methods"
      ],
      answer: 0,
      hint: "Does any client need only part of it?",
      explain:
        "ISP splits by what clients use. If every caller uses all four, splitting adds names and imports with no gain. There is no one-method rule, and no minimum size either."
    },
    {
      type: "mcq",
      tag: "Which pattern?",
      prompt: "Your app uses 2 of the 60 methods in a vendor's payment SDK. Which pattern lets your code depend on a small interface of your own?",
      options: ["Adapter", "Singleton", "Prototype", "Memento"],
      answer: 0,
      hint: "Make something you can't change fit the interface you want.",
      explain:
        "An Adapter implements your small PaymentGateway interface and calls the SDK inside, so the rest of your code never sees the other 58 methods. Singleton, Prototype and Memento deal with instances, copying and saved state."
    }
  ]
};

export default guide;
