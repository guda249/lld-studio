import type { Guide } from "../guides/types";
import beforePy from "./code/ocp-before.py?raw";
import beforeScala from "./code/ocp-before.scala?raw";
import afterPy from "./code/ocp-after.py?raw";
import afterScala from "./code/ocp-after.scala?raw";

const guide: Guide = {
  section: "solid",
  id: "ocp",
  order: 3,
  title: "O: Open/Closed",
  short: "Add new behaviour by adding new code, not by editing code that already works.",
  lede:
    "The O in SOLID. A module should be **open for extension** (you can add new behaviour) but **closed for modification** " +
    "(you don't have to reopen and re-test the code that already works to do it).",
  blocks: [
    {
      type: "text",
      text:
        "Think of a wall socket. You can plug in a kettle, a phone charger or a new air purifier without rewiring the house. The wiring is closed; the socket is open. " +
        "In code, the socket is an **interface** and each appliance is a class that implements it. When a new requirement arrives (a new payment type, a new channel), " +
        "you write one new class and plug it in. The classes that already work, and their tests, stay untouched."
    },
    {
      type: "compare",
      before: {
        title: "Before: one method that knows every channel",
        text:
          "`send` picks the channel with an `if` / `match` on a string. The change request: **marketing wants WhatsApp messages next sprint.** " +
          "You must open this class, add a branch next to working e-mail and SMS code, and re-test all of them. The same string check is usually copied into a `cost()` and a `retry()` method too, so you edit three places and miss one.",
        code: { python: beforePy, scala: beforeScala },
        uml: {
          classes: [{ name: "NotificationService", kind: "concrete", members: ["+ send(channel, user, text)"] }],
          relations: []
        }
      },
      after: {
        title: "After: one class per channel behind an interface",
        text:
          "`NotificationService` only knows the `Notifier` interface. WhatsApp support is **one new class** and one line where the service is built. " +
          "No working class is edited, so nothing that worked yesterday can break today.",
        code: { python: afterPy, scala: afterScala },
        uml: {
          classes: [
            { name: "NotificationService", kind: "concrete", members: ["- notifiers: list", "+ broadcast(user, text)"] },
            { name: "Notifier", kind: "interface", members: ["+ send(user, text)"] },
            { name: "EmailNotifier", kind: "concrete", members: ["+ send(user, text)"] },
            { name: "SmsNotifier", kind: "concrete", members: ["+ send(user, text)"] },
            { name: "WhatsAppNotifier", kind: "concrete", members: ["+ send(user, text)"] }
          ],
          relations: [
            { from: "NotificationService", to: "Notifier", type: "aggregation" },
            { from: "EmailNotifier", to: "Notifier", type: "realization" },
            { from: "SmsNotifier", to: "Notifier", type: "realization" },
            { from: "WhatsAppNotifier", to: "Notifier", type: "realization" }
          ]
        }
      }
    },
    {
      type: "list",
      title: "How to spot it in code",
      style: "crosses",
      items: [
        "An `if` / `elif` chain or `match` on a type code (`\"email\"`, `\"sms\"`) or an enum, and **the same chain appears in several methods**.",
        "`isinstance(x, SomeClass)` / `case _: SomeClass` checks on concrete classes, deciding what to do next.",
        "Every new feature ticket edits the same central file, and its git history is a long list of \"add X support\".",
        "Adding one option means adding a branch in many places, and bugs come from the one you forgot."
      ]
    },
    {
      type: "callout",
      tone: "tip",
      title: "Scala note: a sealed trait is closed on purpose",
      text:
        "A `sealed trait` plus `match` is the opposite trade-off. Adding a new **type** means editing every `match`, but the compiler lists each one for you. Adding a new **operation** is just a new function. " +
        "Choose it when the set of types is fixed (order states, traffic-light colours) and new operations are more likely than new types. Use an open trait when new types keep arriving."
    },
    {
      type: "callout",
      tone: "warn",
      title: "When not to apply it",
      text:
        "Don't build an interface for variation that may never come. That is **speculative generality**: extra classes nobody needs. Two fixed options with no sign of a third? A plain `if` is clearer. " +
        "A good habit: write the simple version first, and refactor towards OCP the second or third time the same spot has to change. Also, fixing a bug in a class is not an OCP violation; OCP is about adding behaviour."
    },
    {
      type: "patterns",
      title: "Patterns that apply it",
      items: [
        { slug: "strategy", how: "Each algorithm (a discount rule, a channel) is a class behind one interface; a new one is a new class." },
        { slug: "decorator", how: "Add behaviour (logging, retries, encryption) by wrapping an object, without editing its class." },
        { slug: "observer", how: "New reactions to an event subscribe from outside; the publisher never changes." },
        { slug: "factory-method", how: "A new product type comes with its own creator subclass instead of another branch in a big `create()`." },
        { slug: "template-method", how: "The skeleton of an algorithm is fixed; new variants override only the steps that differ." },
        { slug: "visitor", how: "New operations over a fixed set of classes are new visitor classes; the classes themselves stay closed." }
      ]
    }
  ],
  quiz: [
    {
      type: "mcq",
      tag: "Concept",
      prompt: "What does \"closed for modification\" mean?",
      options: [
        "New behaviour can be added without editing code that already works",
        "The class is marked final so nobody can extend it",
        "The code may never be changed, not even to fix a bug",
        "The source code is kept private"
      ],
      answer: 0,
      hint: "Closed to what kind of change?",
      explain:
        "OCP means adding a feature should not require reopening working code. It does not forbid bug fixes, and it is not about final or hiding source; in fact the design must stay open to extension through an interface."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "Which line is the OCP problem that will need editing every sale season?",
      code: {
        lang: "python",
        text:
          "class Checkout:\n    def price(self, total: float, code: str) -> float:\n        if code == \"DIWALI\":\n            return total * 0.8\n        elif code == \"STUDENT\":\n            return total - 100\n        return total\n\n\nprint(Checkout().price(1000, \"DIWALI\"))"
      },
      answer: 3,
      hint: "Where does the code choose a rule by name?",
      explain:
        "Line 3 starts the if / elif chain on the discount code. Every new offer adds a branch here, inside a method that already works. A DiscountRule interface with one class per rule (Strategy) lets new offers arrive as new classes."
    },
    {
      type: "mcq",
      tag: "Which pattern?",
      prompt: "A ShippingCost class has a match with 9 courier cases and grows every quarter. Which pattern most directly fixes the OCP problem?",
      options: ["Strategy", "Singleton", "Memento", "Facade"],
      answer: 0,
      hint: "You want one class per courier rule behind one interface.",
      explain:
        "Strategy puts each courier's pricing behind a CourierRate interface, so a new courier is a new class. Singleton controls how many instances exist, Memento saves state, and Facade simplifies a subsystem; none of them removes the growing match."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "A report can be exported as CSV or PDF. Nobody has asked for anything else in two years. Should you add an Exporter interface now?",
      options: [
        "Not yet: a simple if is clearer; refactor when a third format really shows up",
        "Yes: every choice must go behind an interface",
        "Yes, and add a plugin loader for future formats",
        "No: OCP only applies to payment code"
      ],
      answer: 0,
      hint: "Is there any sign of growth?",
      explain:
        "Two stable options with no sign of growth do not justify extra classes; that would be speculative generality. A plugin loader is even more speculative. OCP applies to any code, but you use it where change actually happens."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "In Scala, when is a sealed trait with a match a better choice than an open trait with one class per case?",
      options: [
        "When the set of cases is fixed and new operations are more likely than new cases",
        "When new cases arrive every week",
        "Never; sealed traits always break OCP",
        "Only when the cases have no data"
      ],
      answer: 0,
      hint: "The compiler checks every match against the full list of cases.",
      explain:
        "A sealed trait trades openness to new types for safe, compiler-checked operations. That is right when the types are fixed (order states). If new types keep arriving, every match must be edited, so an open trait fits better. Sealed cases can carry data."
    }
  ]
};

export default guide;
