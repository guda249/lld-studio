import type { Guide } from "../guides/types";
import beforePy from "./code/singleton-abuse-before.py?raw";
import beforeScala from "./code/singleton-abuse-before.scala?raw";
import afterPy from "./code/singleton-abuse-after.py?raw";
import afterScala from "./code/singleton-abuse-after.scala?raw";

const guide: Guide = {
  section: "anti",
  id: "singleton-abuse",
  order: 2,
  title: "Singleton abuse",
  short: "A global variable in a pattern's clothing: hidden dependencies, shared state, hard tests.",
  lede:
    "**Singleton** promises exactly one instance, reachable from anywhere. The \"reachable from anywhere\" part is the trap. " +
    "When classes grab `Database.instance()` deep inside their methods, you have a **global variable** with a nicer name, " +
    "and all the problems globals bring.",
  blocks: [
    {
      type: "text",
      text:
        "The idea in plain words: \"we only need one\" is a decision for the program's start-up code, not for the class itself. " +
        "When the class enforces it, two things go wrong. Its users stop saying what they need (the dependency is **hidden** " +
        "inside a method, not visible in the constructor). And every user shares the same **state**, so one caller's data " +
        "leaks into another's: tests that pass alone fail when run together."
    },
    {
      type: "list",
      title: "What it looks like",
      style: "crosses",
      items: [
        "`Something.instance()` or `Something.get()` calls scattered through business code, often several per file.",
        "Classes whose constructors take nothing, yet they read the database, the config and the clock.",
        "Tests that must call `reset()` on singletons first, or that only pass in a certain order.",
        "Several singletons that call each other (`Cache.instance()` inside `Database.instance()`), so start-up order matters.",
        "A Scala `object` or a Python module-level instance that holds **mutable** business data."
      ]
    },
    {
      type: "callout",
      tone: "warn",
      title: "The change request that exposes it",
      text:
        "\"The Mumbai branch opens next month and needs its own database.\" `InvoiceService` can't be pointed at a second " +
        "database, because it doesn't take one: it always calls `Database.instance()`. The same wall appears when a test " +
        "wants an empty, fake database: there is no way in except patching a global."
    },
    {
      type: "compare",
      before: {
        title: "Before: a global Database",
        text:
          "`InvoiceService` takes nothing in its constructor, so nobody can tell it touches a database. Every caller and " +
          "every test writes into the same rows. Notice the diagram has no line between the two boxes: the link is invisible from the outside.",
        code: { python: beforePy, scala: beforeScala },
        uml: {
          classes: [
            { name: "InvoiceService", kind: "concrete", members: ["+ bill(customer, amount)"] },
            { name: "Database", kind: "concrete", members: ["+ instance()", "+ save(key, amount)"] }
          ],
          relations: []
        }
      },
      after: {
        title: "After: pass it in",
        text:
          "`Database` is a plain class. `InvoiceService` asks for one in its constructor (this is **dependency injection**: " +
          "the caller hands over what a class needs). `main` still creates just one per branch, so you keep \"only one\" " +
          "without the global.",
        code: { python: afterPy, scala: afterScala },
        uml: {
          classes: [
            { name: "InvoiceService", kind: "concrete", members: ["- db: Database", "+ bill(customer, amount)"] },
            { name: "Database", kind: "concrete", members: ["+ name", "+ save(key, amount)"] }
          ],
          relations: [{ from: "InvoiceService", to: "Database", type: "association" }]
        }
      }
    },
    {
      type: "list",
      title: "How to spot it in code",
      style: "plain",
      items: [
        "**Search for the accessor:** `.instance()`, `getInstance`, or a Scala `object` holding a `var` or a mutable collection. Count the call sites; more than a handful is a smell.",
        "**Read the constructor, then the methods.** If the methods use things the constructor never received, those are hidden dependencies.",
        "**Run the tests in a random order.** If some fail, shared state in a singleton is the usual cause.",
        "**Ask \"could there ever be two?\"** Two tenants, two regions, a test copy: if yes, it shouldn't be a singleton."
      ]
    },
    {
      type: "callout",
      tone: "tip",
      title: "When it's acceptable",
      text:
        "Things that are truly one per process and hold no business data: a logger, a read-only config loaded at start-up, " +
        "a stateless helper. A Scala `object` with pure functions, or a Python module with constants, is fine and idiomatic. " +
        "Even then, prefer passing it in where code needs to be tested with a different one. If many threads may create it at once, use the thread-safe version."
    },
    {
      type: "list",
      title: "Principles that fix it",
      style: "ticks",
      items: [
        "**Dependency Inversion:** depend on something you are given (ideally an interface), not on a global you fetch.",
        "**Explicit dependencies:** a class's constructor should list everything it needs, so reading one line tells you what it touches.",
        "**Composition root:** create the long-lived objects once in `main` (or app start-up) and pass them down.",
        "**Immutability:** if something must be shared, make it read-only so sharing can't leak state."
      ]
    },
    {
      type: "patterns",
      title: "Patterns involved",
      items: [
        { slug: "singleton", how: "Keep it for the rare thing that must be one per process and is stateless or read-only; know its costs before you reach for it." },
        { slug: "thread-safe-singleton", how: "If you do need a lazy single instance and threads may race to create it, this is the safe way to build it." },
        { slug: "strategy", how: "Inject an interface (say `Storage`) instead of the concrete class, so a test or a new branch can pass a different implementation." },
        { slug: "abstract-factory", how: "When a whole family of related objects must be chosen per tenant or region, a factory passed in replaces a set of global singletons." }
      ]
    }
  ],
  quiz: [
    {
      type: "mcq",
      tag: "Concept",
      prompt: "What is the main problem with calling Database.instance() inside business methods?",
      hint: "Look at what the constructor tells a reader.",
      options: [
        "It is slower than passing the object in",
        "The dependency is hidden and its state is shared by every caller",
        "Python and Scala don't support it",
        "It creates a new database on every call"
      ],
      answer: 1,
      explain:
        "The class quietly depends on a global, and everyone shares one mutable state, so tests and tenants leak into each other. " +
        "Speed is not the issue (it is one extra call). Both languages support singletons. And it returns the same instance each time; that is exactly the trouble."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "Which line hides a dependency that should be passed in?",
      hint: "The constructor takes nothing, yet the class talks to something.",
      code: {
        lang: "scala",
        text: [
          "class ReportService:",
          "  def monthly(month: Int): String =",
          "    val rows = Database.rowsFor(month)",
          "    s\"${rows.size} invoices in month $month\"",
          "",
          "@main def demo(): Unit = println(ReportService().monthly(3))"
        ].join("\n")
      },
      answer: 3,
      explain:
        "Line 3 reaches for the global Database object. Nothing in ReportService's signature says it needs a database, so a test can't hand it a fake. " +
        "Fix: class ReportService(db: Database) and call db.rowsFor(month). Lines 2 and 4 are ordinary method code."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "Which of these is the most reasonable singleton?",
      hint: "Truly one per process, and no business data that changes.",
      options: [
        "A shopping cart shared by all users",
        "The current user's session",
        "A logger that writes lines to standard output",
        "The order repository for all branches"
      ],
      answer: 2,
      explain:
        "A logger is one per process and holds no business state, so sharing it is harmless. A shared cart or session would mix up users. " +
        "An order repository can need a second copy (another branch, a test), which a singleton forbids."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "After the refactor, main creates one Database and passes it to every service. Is it still \"only one\"?",
      hint: "Who decides how many exist?",
      options: [
        "No, so the design is worse",
        "Yes, but the decision now lives in start-up code, not inside the class",
        "Only if Database is a Scala object",
        "Only in production, never in tests"
      ],
      answer: 1,
      explain:
        "There is still one per run, because main made one. The difference: the class no longer forbids a second, so tests and new branches can make their own. " +
        "It does not need to be a Scala object, and tests are the place where a second, separate instance is most useful."
    },
    {
      type: "order",
      tag: "Put in order",
      prompt: "Order the steps to remove a singleton from InvoiceService safely.",
      hint: "Make the dependency visible before you change who creates it.",
      steps: [
        "Add a db parameter to InvoiceService's constructor",
        "Replace each Database.instance() inside it with self._db / db",
        "Create the Database once in main and pass it in",
        "Give each test its own fresh Database",
        "Delete instance() when no caller uses it any more"
      ],
      shuffled: [3, 1, 4, 0, 2],
      explain:
        "First open a door (the constructor parameter), then use it inside the class, then make start-up code pass the shared instance. " +
        "With that done, tests can each pass a fresh one, and finally the global accessor has no users and can go. Deleting instance() first would break every caller at once."
    }
  ]
};

export default guide;
