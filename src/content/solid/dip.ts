import type { Guide } from "../guides/types";
import beforePy from "./code/dip-before.py?raw";
import beforeScala from "./code/dip-before.scala?raw";
import afterPy from "./code/dip-after.py?raw";
import afterScala from "./code/dip-after.scala?raw";

const guide: Guide = {
  section: "solid",
  id: "dip",
  order: 6,
  title: "D: Dependency Inversion",
  short: "Business rules depend on abstractions they own, not on databases, e-mail or HTTP details.",
  lede:
    "The D in SOLID. High-level code (the business rules) should not depend on low-level code (the database, the mail server). " +
    "**Both should depend on an abstraction**, and that abstraction belongs to the business side.",
  blocks: [
    {
      type: "text",
      text:
        "You plug a lamp into a standard socket; you don't solder it to the wiring inside the wall. The lamp and the wiring both depend on the socket standard, so either can be replaced. " +
        "In code, the business rule (`OrderService`) is the lamp and the database class is the wiring. The **Dependency Inversion Principle** (DIP) says the business rule should declare the socket it needs " +
        "(an `OrderRepository` interface) and let the details plug into it. The dependency arrow that used to point from business code down to MySQL now points from MySQL **up** to the interface: it is **inverted**."
    },
    {
      type: "compare",
      before: {
        title: "Before: OrderService builds its own MySQL class",
        text:
          "`OrderService` creates `MySqlOrderRepository` inside its constructor. Two change requests arrive together: **move to Postgres**, and **add unit tests that run without a database.** " +
          "Both mean editing the business rule, and until you do, every test of `place()` needs a running MySQL server.",
        code: { python: beforePy, scala: beforeScala },
        uml: {
          classes: [
            { name: "OrderService", kind: "concrete", members: ["- repo: MySqlOrderRepository", "+ place(order_id, amount)"] },
            { name: "MySqlOrderRepository", kind: "concrete", members: ["- rows", "+ insert(order_id, amount)"] }
          ],
          relations: [{ from: "OrderService", to: "MySqlOrderRepository", type: "composition" }]
        }
      },
      after: {
        title: "After: both sides depend on OrderRepository",
        text:
          "`OrderService` asks for an `OrderRepository` in its constructor and never names a database. `MySqlOrderRepository` and `InMemoryOrderRepository` implement it. " +
          "Postgres is a new class; tests pass the in-memory one. Only the **composition root** (the start-up code at the bottom) picks which concrete class to use.",
        code: { python: afterPy, scala: afterScala },
        uml: {
          classes: [
            { name: "OrderService", kind: "concrete", members: ["- repo: OrderRepository", "+ place(order_id, amount)"] },
            { name: "OrderRepository", kind: "interface", members: ["+ save(order_id, amount)", "+ find(order_id)"] },
            { name: "MySqlOrderRepository", kind: "concrete", members: ["- rows", "+ save(...)", "+ find(...)"] },
            { name: "InMemoryOrderRepository", kind: "concrete", members: ["- rows", "+ save(...)", "+ find(...)"] }
          ],
          relations: [
            { from: "OrderService", to: "OrderRepository", type: "association" },
            { from: "MySqlOrderRepository", to: "OrderRepository", type: "realization" },
            { from: "InMemoryOrderRepository", to: "OrderRepository", type: "realization" }
          ]
        }
      }
    },
    {
      type: "callout",
      tone: "tip",
      title: "DIP is not the same as dependency injection",
      text:
        "**DIP** is the design rule: depend on abstractions, owned by the high-level side. **Dependency injection** is one technique for following it: pass what a class needs in through its constructor instead of building it inside. " +
        "You need no framework for it; the `OrderService(repo)` constructor above is all there is."
    },
    {
      type: "list",
      title: "How to spot it in code",
      style: "crosses",
      items: [
        "Business classes call constructors of infrastructure classes: `MySqlOrderRepository()`, `SmtpMailer()`, `requests.Session()`.",
        "Business modules import database drivers, HTTP clients or vendor SDKs directly.",
        "Unit tests need a real database, network, file system or clock to pass.",
        "Calls such as `datetime.now()` or `random()` buried inside a rule, so tests are flaky.",
        "The interface lives in the database package and is shaped like the database (`insert_row`, `execute_sql`) instead of like the business need (`save`, `find`)."
      ]
    },
    {
      type: "callout",
      tone: "warn",
      title: "When not to over-apply it",
      text:
        "You don't need an interface in front of stable, pure code: `math`, string helpers, a `Money` value object, the standard collections. Invert dependencies on things that are **slow, external or likely to change**: databases, networks, files, clocks, vendors. " +
        "An interface with exactly one implementation and no test fake is often just noise. Add it when the second implementation (often the test fake) arrives."
    },
    {
      type: "patterns",
      title: "Patterns that apply it",
      items: [
        { slug: "strategy", how: "The context depends on a `Strategy` interface it owns; concrete strategies are details plugged in from outside." },
        { slug: "adapter", how: "Wraps a vendor SDK so it implements your interface, keeping the vendor's types out of business code." },
        { slug: "abstract-factory", how: "Business code asks an abstract factory for objects, so it never names the concrete classes it gets." },
        { slug: "factory-method", how: "Moves the `new ConcreteThing()` call out of the high-level class into a method a subclass or caller decides." },
        { slug: "proxy", how: "Because callers only know the interface, a proxy (caching, access checks) can slip in without them noticing." }
      ]
    }
  ],
  quiz: [
    {
      type: "mcq",
      tag: "Concept",
      prompt: "Who should own the OrderRepository interface?",
      options: [
        "The business module: details implement what the business layer needs",
        "The database module, next to the MySQL code",
        "A shared utils package that everyone imports",
        "Nobody; interfaces should be generated from the database schema"
      ],
      answer: 0,
      hint: "Which side does the inversion protect?",
      explain:
        "The high-level side states what it needs and the detail conforms to it. If the database module owned the interface, business code would still depend on the database package, and its shape would follow the database. A grab-bag utils package or a generated interface has the same problem."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "Which line breaks the Dependency Inversion Principle?",
      code: {
        lang: "python",
        text:
          "class SignupService:\n    def __init__(self, mailer: Mailer) -> None:\n        self._mailer = mailer\n        self._db = PostgresUserTable()\n\n    def sign_up(self, email: str) -> None:\n        self._db.insert(email)\n        self._mailer.send(email, \"Welcome!\")"
      },
      answer: 4,
      hint: "One dependency is handed in; the other is not.",
      explain:
        "Line 4 builds a concrete Postgres class inside the business rule, so the service can't be tested without Postgres or moved to another store. The mailer on line 2 is already injected as an abstraction. Ask for a UserStore in the constructor too."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "A rule checks whether a coupon has expired by calling datetime.now() inside it, and tests fail at midnight. What DIP-style fix helps?",
      options: [
        "Inject a clock (an object or function that returns the time) so tests pass a fixed time",
        "Run the tests only during the day",
        "Copy the rule into the test file",
        "Make the coupon class a Singleton"
      ],
      answer: 0,
      hint: "The clock is an external detail like a database.",
      explain:
        "The current time is a low-level detail. Passing a clock in lets production use the real time and tests use a fixed one. Running tests at certain hours hides the problem, copying the rule tests a copy, and a Singleton doesn't remove the hidden dependency."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "What is the difference between Dependency Inversion and Dependency Injection?",
      options: [
        "Inversion is the rule (depend on abstractions); injection is a technique (pass dependencies in)",
        "They are two names for the same thing",
        "Injection needs a framework; inversion does not",
        "Inversion is about databases only; injection is about everything else"
      ],
      answer: 0,
      hint: "One is the goal, the other is a way to get there.",
      explain:
        "DIP says which way dependencies should point. Dependency injection is a common way to achieve it, done by hand with constructor parameters; no framework is required. Neither is limited to databases."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "Should a PriceFormatter that only turns numbers into strings like 1,299.00 sit behind an interface so it can be injected?",
      options: [
        "Usually not: it is stable, pure and fast, so depending on it directly is fine",
        "Yes: every class must be injected",
        "Yes, and also add a factory for it",
        "No: formatters must be global variables"
      ],
      answer: 0,
      hint: "Is it slow, external or likely to change?",
      explain:
        "DIP pays off for databases, networks, clocks and vendors. A pure, stable helper has nothing to swap and nothing to fake, so an interface plus a factory would only add noise. Global variables are a different problem altogether."
    }
  ]
};

export default guide;
