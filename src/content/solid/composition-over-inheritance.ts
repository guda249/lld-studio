import type { Guide } from "../guides/types";
import beforePy from "./code/composition-over-inheritance-before.py?raw";
import beforeScala from "./code/composition-over-inheritance-before.scala?raw";
import afterPy from "./code/composition-over-inheritance-after.py?raw";
import afterScala from "./code/composition-over-inheritance-after.scala?raw";

const guide: Guide = {
  section: "solid",
  id: "composition-over-inheritance",
  order: 7,
  title: "Composition over inheritance",
  short: "Build behaviour from small parts an object holds, instead of from ever-deeper subclass trees.",
  lede:
    "Not one of the five letters, but the habit that makes all of them easier. When you need to vary behaviour, " +
    "prefer giving an object a part it **has** (and can swap) over making a new subclass it **is**.",
  blocks: [
    {
      type: "text",
      text:
        "Inheritance fixes behaviour when you write the class: a `TimestampFileLogger` is timestamped and file-based forever. It also grows badly: each new **dimension** (a way things vary, such as format or destination) " +
        "multiplies the number of subclasses. **Composition** builds an object from parts it holds in fields and **delegates** (hands work over) to them. Each part varies on its own, combinations are free, " +
        "and you can even swap a part while the program runs. This is the idea behind \"favour object composition over class inheritance\", a line from the original Design Patterns book."
    },
    {
      type: "compare",
      before: {
        title: "Before: a subclass for every combination",
        text:
          "One subclass changes the format, another changes the destination. Wanting both forces you to pick one parent and **copy** the other's code. " +
          "The change request: **add a JSON format and a Slack destination.** With inheritance that is 3 formats × 3 places = 9 classes, and every fix to the timestamp format must be made in three of them.",
        code: { python: beforePy, scala: beforeScala },
        uml: {
          classes: [
            { name: "Logger", kind: "concrete", members: ["+ log(msg)", "+ format(msg)", "+ write(line)"] },
            { name: "TimestampLogger", kind: "concrete", members: ["+ format(msg)"] },
            { name: "FileLogger", kind: "concrete", members: ["+ lines", "+ write(line)"] },
            { name: "TimestampFileLogger", kind: "concrete", members: ["+ format(msg)  (copied)"] }
          ],
          relations: [
            { from: "TimestampLogger", to: "Logger", type: "inheritance" },
            { from: "FileLogger", to: "Logger", type: "inheritance" },
            { from: "TimestampFileLogger", to: "FileLogger", type: "inheritance" }
          ]
        }
      },
      after: {
        title: "After: Logger has a Formatter and a Sink",
        text:
          "The two dimensions become two small interfaces. `Logger` holds one of each and delegates. JSON is one new `Formatter`, Slack is one new `Sink`: 3 + 3 classes cover all 9 combinations. " +
          "And `log.formatter = PlainFormatter()` changes behaviour at runtime, which no subclass can do. (The diagram shows one implementation of each interface; the code has two.)",
        code: { python: afterPy, scala: afterScala },
        uml: {
          classes: [
            { name: "Logger", kind: "concrete", members: ["+ formatter: Formatter", "- sink: Sink", "+ log(msg)"] },
            { name: "Formatter", kind: "interface", members: ["+ format(msg)"] },
            { name: "Sink", kind: "interface", members: ["+ write(line)"] },
            { name: "TimestampFormatter", kind: "concrete", members: ["+ format(msg)"] },
            { name: "MemorySink", kind: "concrete", members: ["+ lines", "+ write(line)"] }
          ],
          relations: [
            { from: "Logger", to: "Formatter", type: "association" },
            { from: "Logger", to: "Sink", type: "association" },
            { from: "TimestampFormatter", to: "Formatter", type: "realization" },
            { from: "MemorySink", to: "Sink", type: "realization" }
          ]
        }
      }
    },
    {
      type: "list",
      title: "What composition buys you",
      style: "ticks",
      items: [
        "**Combinations for free**: N formats + M destinations is N + M classes, not N × M.",
        "**Change at runtime**: swap the part in the field; no new object type needed.",
        "**Hidden insides**: the parts stay private, so the object's public face stays small (inheritance exposes every parent method).",
        "**Easy tests**: hand in a fake part, such as `MemorySink`, and check what it received.",
        "**SOLID for free**: each part has one job (SRP), new parts plug in without edits (OCP), and the logger depends on interfaces (DIP)."
      ]
    },
    {
      type: "list",
      title: "How to spot inheritance that should be composition",
      style: "crosses",
      items: [
        "Class names that glue two ideas together: `TimestampFileLogger`, `EmailedPdfReport`, `CachedRemoteUserService`.",
        "The same override copied into several sibling or cousin subclasses.",
        "A subclass that exists only to reuse a few parent methods, and fails the is-a test (`Car extends Engine` from lesson 1).",
        "Hierarchies three or more levels deep, where a change at the top surprises classes at the bottom (the **fragile base class** problem).",
        "Subclasses that override a method to do nothing, or to throw (see Liskov, lesson 4)."
      ]
    },
    {
      type: "callout",
      tone: "warn",
      title: "When inheritance is the right tool",
      text:
        "\"Over\" means **prefer**, not **never**. Inheritance is fine when the is-a test passes, the child keeps every promise of the parent (Liskov), and there is only one dimension of change. " +
        "Implementing an interface or trait is inheritance too, and composition depends on it. Template Method and framework base classes (a test case class, a UI widget) use inheritance well. " +
        "And don't wrap every two-line method in a separate part: composition adds objects and indirection, so use it where things really vary."
    },
    {
      type: "callout",
      tone: "tip",
      title: "Scala note: traits as mix-ins",
      text:
        "Scala can also stack behaviour with trait mix-ins (`class X extends Logger, Timestamped`). That avoids copying code, but the mix is still fixed when you write the class. " +
        "Use mix-ins for small, stable add-ons, and fields (composition) when the part must be chosen or swapped at runtime."
    },
    {
      type: "patterns",
      title: "Patterns built on composition",
      items: [
        { slug: "strategy", how: "The `Formatter` above is a Strategy: an algorithm held in a field and swapped at runtime." },
        { slug: "bridge", how: "Two dimensions (what and how) become two hierarchies joined by a field, exactly like Formatter and Sink." },
        { slug: "decorator", how: "Adds behaviour by wrapping an object in another that holds it, layer by layer, instead of subclassing." },
        { slug: "state", how: "The object holds a state object and delegates to it; changing state means swapping that field." },
        { slug: "composite", how: "A group holds child parts of the same interface, so a tree is built from objects rather than from subclasses." }
      ]
    }
  ],
  quiz: [
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "Reports come in 3 formats (PDF, CSV, HTML) and go to 3 places (e-mail, disk, Slack). With one subclass per combination, how many concrete classes do you need, and how many with composition?",
      options: ["9 with subclasses, 6 with composition", "6 with subclasses, 9 with composition", "3 either way", "9 either way"],
      answer: 0,
      hint: "Multiply for subclasses; add for parts.",
      explain:
        "Subclasses need one class per pair: 3 × 3 = 9. Composition needs one class per format plus one per place: 3 + 3 = 6, and the gap grows with every new option."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "Which line is the clearest sign that inheritance is being used to borrow code?",
      code: {
        lang: "scala",
        text:
          "class HttpClient:\n  def get(url: String): String = s\"GET $url\"\n\nclass WeatherService extends HttpClient:\n  def today(city: String): String =\n    get(s\"https://weather.example/$city\")\n\n@main def demo(): Unit =\n  println(WeatherService().today(\"Pune\"))"
      },
      answer: 4,
      hint: "Say the is-a sentence for each class.",
      explain:
        "Line 4 makes WeatherService an HttpClient, which fails the is-a test and exposes get() to every caller. WeatherService should hold an HttpClient in a field and call it, which also lets tests hand in a fake client."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "What can composition do that a subclass can't?",
      options: [
        "Change an object's behaviour while the program runs, by swapping a part",
        "Reuse code from another class",
        "Implement an interface",
        "Make the program run faster"
      ],
      answer: 0,
      hint: "Think of log.formatter = PlainFormatter().",
      explain:
        "A subclass's behaviour is fixed when the class is written; a part in a field can be replaced at runtime. Both approaches reuse code, interfaces are implemented by inheritance, and speed is not the point."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "A test framework asks you to extend its TestCase base class. Does \"composition over inheritance\" mean you should avoid it?",
      options: [
        "No: it is a stable, designed-for-extension base class with one job, so inheritance is fine",
        "Yes: inheritance should never be used",
        "Yes: wrap TestCase in a field instead",
        "No, but only if the test has fewer than five methods"
      ],
      answer: 0,
      hint: "The principle says prefer, not never.",
      explain:
        "Base classes built to be extended, with a clear is-a relationship, are a good use of inheritance (this is Template Method). Avoiding it here would fight the framework for no gain. Method counts are not the test."
    },
    {
      type: "mcq",
      tag: "Which pattern?",
      prompt: "A Notifier must support several message styles and several delivery channels, chosen separately. Which pattern turns the two dimensions into two hierarchies joined by a field?",
      options: ["Bridge", "Singleton", "Iterator", "Memento"],
      answer: 0,
      hint: "It is the pattern of the Formatter + Sink logger above.",
      explain:
        "Bridge splits two independent dimensions and joins them with a field, so N + M classes cover N × M combinations. Singleton, Iterator and Memento solve unrelated problems: one instance, walking a collection, and saving state."
    }
  ]
};

export default guide;
