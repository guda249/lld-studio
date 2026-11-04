import type { Guide } from "../guides/types";
import beforePy from "./code/deep-inheritance-before.py?raw";
import beforeScala from "./code/deep-inheritance-before.scala?raw";
import afterPy from "./code/deep-inheritance-after.py?raw";
import afterScala from "./code/deep-inheritance-after.scala?raw";
import fragilePy from "./code/deep-inheritance-fragile.py?raw";
import fragileScala from "./code/deep-inheritance-fragile.scala?raw";

const guide: Guide = {
  section: "anti",
  id: "deep-inheritance",
  order: 4,
  title: "Deep inheritance",
  short: "Tall class trees built to reuse code: fragile base classes and a subclass for every combination.",
  lede:
    "Inheritance means \"is a kind of\". **Deep inheritance** is using it as a copy-paste shortcut: a new subclass, " +
    "one level lower, every time you want to reuse some code and add a little more. The tree grows tall, each class " +
    "depends on the private habits of the ones above, and combinations multiply.",
  blocks: [
    {
      type: "text",
      text:
        "The idea in plain words: a subclass is welded to its parent. It inherits every method, every field and every " +
        "internal decision, forever. That is fine for a true \"kind of\" link one or two levels deep. It hurts when the " +
        "tree is used to mix **independent features** (format, delivery, schedule): every new mix needs a new class, " +
        "and a change near the top ripples down to every leaf."
    },
    {
      type: "list",
      title: "What it looks like",
      style: "crosses",
      items: [
        "Class names that are lists of features: `ScheduledEmailedPdfReport`.",
        "Four or more levels between the base class and the class you actually use.",
        "Two branches of the tree with the same method copied into each (`send()` in both the PDF and the CSV branch).",
        "Subclasses that override a method only to switch it off (`raise NotImplementedError`).",
        "A class that extends another just to borrow its helpers: `Report extends DatabaseConnection`."
      ]
    },
    {
      type: "callout",
      tone: "warn",
      title: "The change request that exposes it",
      text:
        "\"Accounts wants the same report as CSV, by email.\" The email code lives in `EmailedPdfReport`, under the PDF " +
        "branch. A CSV report can't inherit from it without becoming a PDF. So `send()` gets copied into a new " +
        "`EmailedCsvReport`, and next month \"scheduled CSV\" copies `run_monday()` too. Two features with two options each " +
        "already need a class per combination."
    },
    {
      type: "compare",
      before: {
        title: "Before: a level per feature",
        text:
          "Format, delivery and schedule are stacked as levels. The CSV branch has to copy `send()`, because email was " +
          "welded to the PDF branch.",
        code: { python: beforePy, scala: beforeScala },
        uml: {
          classes: [
            { name: "Report", kind: "concrete", members: ["+ build()"] },
            { name: "PdfReport", kind: "concrete", members: ["+ build()"] },
            { name: "CsvReport", kind: "concrete", members: ["+ build()"] },
            { name: "EmailedPdfReport", kind: "concrete", members: ["+ send(to)"] },
            { name: "EmailedCsvReport", kind: "concrete", members: ["+ send(to)"] },
            { name: "ScheduledEmailedPdfReport", kind: "concrete", members: ["+ run_monday(to)"] }
          ],
          relations: [
            { from: "PdfReport", to: "Report", type: "inheritance" },
            { from: "CsvReport", to: "Report", type: "inheritance" },
            { from: "EmailedPdfReport", to: "PdfReport", type: "inheritance" },
            { from: "EmailedCsvReport", to: "CsvReport", type: "inheritance" },
            { from: "ScheduledEmailedPdfReport", to: "EmailedPdfReport", type: "inheritance" }
          ]
        }
      },
      after: {
        title: "After: has-a instead of is-a",
        text:
          "`Report` holds a `Formatter` and a `Delivery`. Each one varies on its own, so CSV-by-email is just " +
          "`Report(rows, CsvFormat(), EmailDelivery(...))`. A new format is one class; it works with every delivery at once.",
        code: { python: afterPy, scala: afterScala },
        uml: {
          classes: [
            { name: "Report", kind: "concrete", members: ["+ run()"] },
            { name: "Formatter", kind: "interface", members: ["+ render(rows)"] },
            { name: "Delivery", kind: "interface", members: ["+ deliver(text)"] },
            { name: "PdfFormat", kind: "concrete", members: ["+ render(rows)"] },
            { name: "CsvFormat", kind: "concrete", members: ["+ render(rows)"] },
            { name: "EmailDelivery", kind: "concrete", members: ["+ deliver(text)"] }
          ],
          relations: [
            { from: "Report", to: "Formatter", type: "association" },
            { from: "Report", to: "Delivery", type: "association" },
            { from: "PdfFormat", to: "Formatter", type: "realization" },
            { from: "CsvFormat", to: "Formatter", type: "realization" },
            { from: "EmailDelivery", to: "Delivery", type: "realization" }
          ]
        }
      }
    },
    {
      type: "code",
      title: "The fragile base class problem",
      code: { python: fragilePy, scala: fragileScala },
      note:
        "CountingPlaylist overrides both add and add_all, and counts 4 songs for 2. It breaks because the base class's add_all happens to call add. " +
        "If the base author later rewrites add_all to append directly, the count changes again, without anyone touching the subclass. " +
        "The safer version wraps a Playlist (has-a) and counts in one place."
    },
    {
      type: "list",
      title: "How to spot it in code",
      style: "plain",
      items: [
        "**Measure the depth.** Count the levels from your class up to the root (not counting `object` / `Any`). More than two or three in your own code deserves a look.",
        "**Read the class names.** Feature lists glued together (`EmailedCsv…`) mean features are being mixed by inheritance.",
        "**Look for copies across branches.** The same method in two sibling branches means the feature should be a separate object.",
        "**Follow the super chain.** When each level adds a bit and calls `super()`, one behaviour is spread over many files.",
        "**Try the \"is a\" sentence.** \"An emailed report is a kind of PDF report\" sounds wrong, and that's the sign."
      ]
    },
    {
      type: "callout",
      tone: "tip",
      title: "When inheritance is fine",
      text:
        "Shallow trees for true \"kind of\" links: `Card` and `Upi` both implement `PaymentMethod`. Implementing an " +
        "interface or trait is the healthy case. A base class **designed** for extension (a framework's `TestCase`, " +
        "a Template Method with clearly named hooks) is fine too. Scala's sealed traits with case classes (a fixed set " +
        "of variants) and Python's ABCs are good uses. The trouble starts when you inherit to reuse code, not to say what something is."
    },
    {
      type: "list",
      title: "Principles that fix it",
      style: "ticks",
      items: [
        "**Favour composition over inheritance:** hold the part that varies as a field, and pass it in.",
        "**Liskov Substitution:** a subclass must work anywhere its parent does. Overrides that throw or quietly change meaning break it.",
        "**Inherit interfaces, not implementations:** extend a trait or ABC that only declares methods; reuse code by calling helpers.",
        "**Design for extension or forbid it:** mark classes `final` (Scala) or document the hooks, so nobody builds on internal details."
      ]
    },
    {
      type: "patterns",
      title: "Patterns that replace a tall tree",
      items: [
        { slug: "strategy", how: "Each varying feature (format, delivery) becomes a strategy object the main class holds, instead of a subclass level." },
        { slug: "bridge", how: "When two dimensions vary (what the report is × how it is sent), Bridge keeps them as two small hierarchies joined by a field." },
        { slug: "decorator", how: "Optional extras (scheduled, compressed, logged) wrap the object one layer at a time instead of adding subclasses for every mix." },
        { slug: "template-method", how: "The acceptable use of inheritance: one shallow base class that fixes the steps and names the hooks subclasses may fill in." }
      ]
    }
  ],
  quiz: [
    {
      type: "mcq",
      tag: "Concept",
      prompt: "Three formats and four delivery methods are built as subclasses for each mix. How many leaf classes do you need?",
      hint: "Every format paired with every delivery.",
      options: ["7", "12", "4", "3"],
      answer: 1,
      explain:
        "Every combination is its own class, so 3 × 4 = 12, and one more delivery adds 3 more. With composition you need 3 + 4 = 7 small classes, " +
        "and a new delivery adds just one. 4 or 3 would only cover one dimension."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "Which line uses inheritance only to borrow code, not to say what the class is?",
      hint: "Read it as a sentence: X is a kind of Y.",
      code: {
        lang: "python",
        text: [
          "class DatabaseConnection:",
          "    def query(self, sql: str) -> list[str]:",
          "        return [\"row1\", \"row2\"]",
          "",
          "class SalesReport(DatabaseConnection):",
          "    def total(self) -> int:",
          "        return len(self.query(\"SELECT * FROM sales\"))",
          "",
          "print(SalesReport().total())"
        ].join("\n")
      },
      answer: 5,
      explain:
        "A sales report is not a kind of database connection; it extends it only to call query(). Now the report exposes every connection method and can't be tested without one. " +
        "Pass a DatabaseConnection in instead. Line 7 is a normal call, and line 1 is a fine class on its own."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "In the playlist example, why does the counting subclass report 4 songs for 2?",
      hint: "What does the base class's add_all call inside?",
      code: {
        lang: "scala",
        text: [
          "class Playlist:",
          "  def add(song: String): Unit = ()",
          "  def addAll(list: List[String]): Unit = list.foreach(add)"
        ].join("\n")
      },
      options: [
        "Scala and Python lists count from 1",
        "addAll in the base calls add, so the subclass counts once in addAll and again in each add",
        "super calls always run twice",
        "The base class keeps its own counter"
      ],
      answer: 1,
      explain:
        "The subclass relied on not knowing how addAll works inside, and it calls add. That hidden detail is what makes the base class fragile. " +
        "Indexes don't matter here, super runs once, and the base class has no counter at all."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "Which of these is a healthy use of inheritance?",
      hint: "True kind-of link, shallow, designed for it.",
      options: [
        "ScheduledEmailedPdfReport extends EmailedPdfReport extends PdfReport extends Report",
        "Card and Upi each implement a PaymentMethod interface with one pay method",
        "Invoice extends EmailSender to reuse its send method",
        "Square extends Rectangle and throws when width and height differ"
      ],
      answer: 1,
      explain:
        "Implementing a small interface for a true kind-of link is the good case. The four-level chain mixes features. Invoice-extends-EmailSender borrows code. " +
        "Square-extends-Rectangle breaks Liskov: code that sets width and height separately fails for a Square."
    },
    {
      type: "order",
      tag: "Put in order",
      prompt: "Order the steps to flatten a report hierarchy into composition.",
      hint: "Name the varying parts first, delete the old classes last.",
      steps: [
        "List the features that vary independently (format, delivery)",
        "Create an interface for each feature",
        "Move each subclass's special code into a class that implements one interface",
        "Give Report fields for the interfaces and pass them in",
        "Replace uses of the old subclasses, then delete them"
      ],
      shuffled: [2, 4, 0, 3, 1],
      explain:
        "You can only split what you have named, so the varying features come first, then an interface for each, then the moved code. " +
        "Report gets its fields once the parts exist, and the old subclasses go last, when nothing uses them; deleting them early breaks callers."
    }
  ]
};

export default guide;
