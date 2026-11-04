import type { Guide } from "../guides/types";
import beforePy from "./code/lsp-before.py?raw";
import beforeScala from "./code/lsp-before.scala?raw";
import afterPy from "./code/lsp-after.py?raw";
import afterScala from "./code/lsp-after.scala?raw";

const guide: Guide = {
  section: "solid",
  id: "lsp",
  order: 4,
  title: "L: Liskov Substitution",
  short: "A subtype must work anywhere its parent type is expected, without the caller noticing.",
  lede:
    "The L in SOLID, named after Barbara Liskov. If code works with a parent type, it must keep working when you hand it **any** child of that type. " +
    "A child may do more than its parent, but never less, and never something different.",
  blocks: [
    {
      type: "text",
      text:
        "Inheritance is a promise. When `GiftCard` says \"I am a `PaymentMethod`\", every caller that was written for `PaymentMethod` will trust it to do everything a `PaymentMethod` does. " +
        "Think of renting a car: whichever sedan they hand you, the brake is where you expect it. A sedan with the pedals swapped is still \"a car\", but it breaks the promise. " +
        "The **Liskov Substitution Principle** (LSP) says a subtype must keep its parent's promises, so polymorphism stays safe."
    },
    {
      type: "compare",
      before: {
        title: "Before: a gift card that can't refund",
        text:
          "The change request: **accept gift cards at checkout.** The team adds `GiftCard` as another `PaymentMethod`, but gift cards can't be refunded, so `refund()` raises an error. " +
          "`cancel_order` was written months ago and trusts every `PaymentMethod`. Now cancelling any order paid by gift card crashes, far away from the class that caused it.",
        code: { python: beforePy, scala: beforeScala },
        uml: {
          classes: [
            { name: "PaymentMethod", kind: "interface", members: ["+ pay(amount)", "+ refund(amount)"] },
            { name: "Card", kind: "concrete", members: ["+ pay(amount)", "+ refund(amount)"] },
            { name: "GiftCard", kind: "concrete", members: ["- balance", "+ pay(amount)", "+ refund(amount) ✗"] }
          ],
          relations: [
            { from: "Card", to: "PaymentMethod", type: "realization" },
            { from: "GiftCard", to: "PaymentMethod", type: "realization" }
          ]
        }
      },
      after: {
        title: "After: promise only what you can keep",
        text:
          "`PaymentMethod` now promises only `pay()`. `RefundablePayment` adds `refund()`, and only `Card` makes that promise. `cancel_order` asks for a `RefundablePayment`, " +
          "so a gift card can't even be passed in: a type checker (mypy) or the Scala compiler catches it before it runs. Every subtype can now stand in for its parent.",
        code: { python: afterPy, scala: afterScala },
        uml: {
          classes: [
            { name: "PaymentMethod", kind: "interface", members: ["+ pay(amount)"] },
            { name: "RefundablePayment", kind: "interface", members: ["+ refund(amount)"] },
            { name: "GiftCard", kind: "concrete", members: ["- balance", "+ pay(amount)"] },
            { name: "Card", kind: "concrete", members: ["+ pay(amount)", "+ refund(amount)"] }
          ],
          relations: [
            { from: "RefundablePayment", to: "PaymentMethod", type: "realization" },
            { from: "GiftCard", to: "PaymentMethod", type: "realization" },
            { from: "Card", to: "RefundablePayment", type: "realization" }
          ]
        }
      }
    },
    {
      type: "list",
      title: "The rules a subtype must follow",
      style: "ticks",
      items: [
        "**Accept at least what the parent accepts.** If the parent takes any amount, the child can't demand amounts over 100. (Don't strengthen preconditions.)",
        "**Give at least what the parent gives.** If the parent always returns a receipt, the child can't return `None`. (Don't weaken postconditions.)",
        "**Keep the parent's rules true.** If a balance can never go negative in the parent, it can't in the child either. (Keep invariants.)",
        "**No surprise errors.** Don't raise kinds of exceptions the caller was never told about."
      ]
    },
    {
      type: "callout",
      tone: "tip",
      title: "The textbook case: Square and Rectangle",
      text:
        "In maths a square is a rectangle. In code, a **mutable** `Square` that extends `Rectangle` breaks LSP: a caller sets width 5 and height 4, expects area 20, and gets 16 because the square changed both sides. " +
        "The `Square` in lesson 1 is fine because its sides can't change after it is built. LSP is about **behaviour** callers rely on, not about what sounds right in English."
    },
    {
      type: "list",
      title: "How to spot it in code",
      style: "crosses",
      items: [
        "A child overrides a method only to raise `NotImplementedError` / `UnsupportedOperationException`.",
        "An overridden method quietly does nothing (`pass`, `()`), where the parent did real work.",
        "Callers check the real type before calling: `if isinstance(m, GiftCard)` / `case _: GiftCard =>`.",
        "The parent's tests fail when you run them against the child.",
        "Comments such as \"don't call this on X\" next to an inherited method."
      ]
    },
    {
      type: "callout",
      tone: "warn",
      title: "When not to over-apply it",
      text:
        "LSP covers what callers can **observe**: inputs, outputs, errors and rules. A child may be faster, cache results, or write extra logs, as long as the promise holds. " +
        "Don't refuse every override for fear of LSP, and don't build deep \"capability\" hierarchies for differences no caller cares about. If no code ever refunds, there is no promise to split."
    },
    {
      type: "patterns",
      title: "Patterns that depend on it",
      items: [
        { slug: "strategy", how: "The context swaps strategies freely, which only works if every strategy honours the same contract." },
        { slug: "state", how: "Each state class must accept every event the context forwards, even if the answer is \"not allowed now\"." },
        { slug: "template-method", how: "Subclasses fill in steps; a step that breaks the parent's expectations breaks the whole algorithm." },
        { slug: "decorator", how: "A decorator must behave like the object it wraps, or stacking decorators gives surprises." }
      ]
    }
  ],
  quiz: [
    {
      type: "mcq",
      tag: "Concept",
      prompt: "ReadOnlyList extends List and raises an error in add(). Does this break LSP?",
      options: [
        "Yes: code that expects a List may call add(), and it will now fail",
        "No: raising an error is a valid way to say no",
        "No: LSP only applies to abstract classes",
        "Only if ReadOnlyList is used in a different module"
      ],
      answer: 0,
      hint: "Can every caller of List safely receive a ReadOnlyList?",
      explain:
        "A List promises add(); a child that refuses it can't stand in for its parent. A separate read-only interface that List also implements fixes it. LSP applies to all subtyping, abstract or not, and in any module."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "A subclass overrides save() and also writes an audit log line. Is that an LSP violation?",
      options: [
        "No: it does more while keeping the same promise",
        "Yes: any change in an override breaks LSP",
        "Yes: logging is a side effect",
        "Only if the log file is shared"
      ],
      answer: 0,
      hint: "Does the caller see anything break?",
      explain:
        "The caller still gets the object saved, with the same inputs, outputs and errors. Doing extra work that callers can't observe through the contract is allowed. Overrides are fine when the promise holds."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "Which line breaks Liskov substitution?",
      code: {
        lang: "scala",
        text:
          "trait Storage:\n  def write(key: String, value: String): Unit\n\nclass DiskStorage extends Storage:\n  def write(key: String, value: String): Unit =\n    println(s\"disk $key=$value\")\n\nclass ArchiveStorage extends Storage:\n  def write(key: String, value: String): Unit =\n    throw UnsupportedOperationException(\"archive is read-only\")"
      },
      answer: 10,
      hint: "Which child refuses something the trait promises?",
      explain:
        "Line 10 throws where the Storage trait promises a working write. Any code holding a Storage will crash when it gets an ArchiveStorage. Split a ReadableStorage from a WritableStorage, and let the archive be readable only."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "A parent's discount(amount) accepts any amount. The child version raises an error for amounts below 100. Which LSP rule does it break?",
      options: [
        "It accepts less input than the parent (a stronger precondition)",
        "It returns less than the parent (a weaker postcondition)",
        "It changes the class name",
        "None; children may add checks freely"
      ],
      answer: 0,
      hint: "The problem is about what goes in, not what comes out.",
      explain:
        "The child demands more of its caller than the parent did, so code that passed 50 to the parent now fails. That is a stronger precondition. Nothing is wrong with what comes out, and names are irrelevant."
    },
    {
      type: "mcq",
      tag: "Find the problem",
      prompt: "You see if isinstance(shape, Square): ... before every call to set_width. What does it most likely tell you?",
      options: [
        "Square doesn't behave like its parent, so callers work around it: an LSP violation",
        "The code follows OCP",
        "Square should be a Singleton",
        "Nothing; type checks are always good style"
      ],
      answer: 0,
      hint: "Why would a caller need to know the real type?",
      explain:
        "Callers only check the real type when a subtype can't be trusted to act like the parent. That is the classic sign of an LSP problem (and it breaks OCP too, since each new subtype adds another check)."
    }
  ]
};

export default guide;
