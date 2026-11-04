import type { Guide } from "../guides/types";
import beforePy from "./code/srp-before.py?raw";
import beforeScala from "./code/srp-before.scala?raw";
import afterPy from "./code/srp-after.py?raw";
import afterScala from "./code/srp-after.scala?raw";

const guide: Guide = {
  section: "solid",
  id: "srp",
  order: 2,
  title: "S: Single Responsibility",
  short: "A class should have one reason to change: it answers to one group of people.",
  lede:
    "The S in SOLID. It is not \"a class should do one tiny thing\". It means a class should change for one reason only, " +
    "because it serves one group of people (an **actor**: finance, design, the platform team).",
  blocks: [
    {
      type: "text",
      text:
        "Think of a restaurant. The chef cooks, the cashier bills, the waiter serves. If the chef also did the billing, a new tax rule would disturb the kitchen. " +
        "Code works the same way: when two groups of people can each ask you to edit the same class, a change for one can break the other. " +
        "The **Single Responsibility Principle** (SRP) says: give each of those reasons its own class. A class can have many methods, as long as they all change for the same reason."
    },
    {
      type: "compare",
      before: {
        title: "Before: one Invoice, three bosses",
        text:
          "`Invoice` works out the tax (finance), lays out the text (design) and writes JSON to storage (platform). The change request: **design wants a new layout with the GST shown on its own line.** " +
          "To do it you edit the same class that holds the tax maths, so the finance tests must run again, and the platform team gets a merge conflict on a file they also touch.",
        code: { python: beforePy, scala: beforeScala },
        uml: {
          classes: [
            { name: "Invoice", kind: "concrete", members: ["+ number", "+ items", "+ total()", "+ render()", "+ save(disk)"] },
            { name: "LineItem", kind: "concrete", members: ["+ name", "+ price", "+ qty"] }
          ],
          relations: [{ from: "Invoice", to: "LineItem", type: "association" }]
        }
      },
      after: {
        title: "After: one class per reason to change",
        text:
          "`Invoice` keeps only the money rules. `InvoiceRenderer` owns the layout and `InvoiceStore` owns storage; both take an `Invoice` and read from it. " +
          "The new layout is now a change to `InvoiceRenderer` alone. The tax code is not opened, so it can't break.",
        code: { python: afterPy, scala: afterScala },
        uml: {
          classes: [
            { name: "InvoiceRenderer", kind: "concrete", members: ["+ render(inv)"] },
            { name: "InvoiceStore", kind: "concrete", members: ["- disk", "+ save(inv)", "+ load(number)"] },
            { name: "Invoice", kind: "concrete", members: ["+ number", "+ items", "+ total()"] },
            { name: "LineItem", kind: "concrete", members: ["+ name", "+ price", "+ qty"] }
          ],
          relations: [
            { from: "InvoiceRenderer", to: "Invoice", type: "dependency" },
            { from: "InvoiceStore", to: "Invoice", type: "dependency" },
            { from: "Invoice", to: "LineItem", type: "association" }
          ]
        }
      }
    },
    {
      type: "callout",
      tone: "tip",
      title: "The one-sentence test",
      text:
        "Describe the class in one sentence. \"Invoice works out what the customer owes\" is one responsibility. \"Invoice works out what is owed **and** prints it **and** saves it\" is three. Every **and** is a place you might split."
    },
    {
      type: "list",
      title: "How to spot it in code",
      style: "crosses",
      items: [
        "Names with **And**, **Manager**, **Helper**, **Utils** or **Processor**: they invite unrelated work.",
        "One file imports from areas that have nothing to do with each other: a PDF library, a database driver and the pricing rules.",
        "The class's methods split into groups that never use each other's fields.",
        "`git log` shows people from different teams editing the same class for unrelated tickets.",
        "A small change (a new font) forces you to re-run tests for something unrelated (tax)."
      ]
    },
    {
      type: "callout",
      tone: "warn",
      title: "When not to apply it",
      text:
        "Don't split a 20-line class into five classes of four lines each. That is **ravioli code**: lots of tiny pieces, and nobody can see the whole dish. " +
        "Split when two parts really change for different reasons, or when they already did. A small script, a prototype or a class with one caller can stay in one piece. " +
        "SRP is also not \"one method per class\": `Invoice` keeping `total()`, `subtotal()` and `tax()` together is fine, because they all change when the money rules change."
    },
    {
      type: "patterns",
      title: "Patterns that apply it",
      items: [
        { slug: "facade", how: "After you split a big class, a Facade gives callers one simple entry point again, so splitting does not make the code harder to use." },
        { slug: "strategy", how: "Moves one changeable rule (the tax calculation) into its own object, so the rule can change without touching the class that uses it." },
        { slug: "command", how: "Turns each action (\"send invoice\", \"refund\") into its own small class instead of one huge service with a method per action." },
        { slug: "observer", how: "Side jobs (send an e-mail, update stats) listen for an event instead of living inside the class that raises it." }
      ]
    }
  ],
  quiz: [
    {
      type: "mcq",
      tag: "Concept",
      prompt: "What does \"one responsibility\" mean in SRP?",
      options: [
        "One reason to change: the class answers to one group of people",
        "Exactly one public method per class",
        "No class longer than 50 lines",
        "One class per database table"
      ],
      answer: 0,
      hint: "Who would ask you to edit this class?",
      explain:
        "SRP is about reasons to change. A class with ten methods can follow it if they all change together; a short class can break it if two teams pull it in different directions. Method counts, line counts and tables are not the test."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "A User class checks password strength and also builds the welcome e-mail text. How many reasons to change does it have?",
      options: ["Two: security rules and e-mail content", "One: it is all about users", "Three: data, rules and e-mail", "None, as long as it has tests"],
      answer: 0,
      hint: "Which teams would file tickets against it?",
      explain:
        "The security team changes password rules; marketing changes the welcome text. That is two reasons, so the e-mail part belongs in something like WelcomeMailer. \"It is all about users\" is too broad a theme, and tests don't change how many reasons there are."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "This class is mostly about orders. Which line brings in a second responsibility?",
      code: {
        lang: "scala",
        text:
          "class OrderService(repo: OrderRepo):\n  def place(o: Order): Unit =\n    require(o.items.nonEmpty)\n    repo.save(o)\n\n  def total(o: Order): BigDecimal =\n    o.items.map(_.price).sum\n\n  def toCsv(o: Order): String =\n    o.items.map(i => s\"${i.name},${i.price}\").mkString(\"\\n\")"
      },
      answer: 9,
      hint: "Which method would change if the finance team wanted a new spreadsheet format?",
      explain:
        "toCsv (line 9) is about how orders are exported, which changes when a report format changes. Placing and totalling orders are the service's own job. Move the export into an OrderCsvExporter."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "Which class name is the strongest hint of an SRP problem?",
      options: ["ReportManagerAndMailer", "TaxCalculator", "InvoiceRenderer", "LineItem"],
      answer: 0,
      hint: "Look for words that let anything in.",
      explain:
        "\"Manager\" is vague and \"And\" names two jobs outright. TaxCalculator, InvoiceRenderer and LineItem each name one clear job."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "A 25-line CsvRow class parses a line and formats it back. Only one script uses it. A teammate wants to split it into CsvParser, CsvFormatter, CsvField and CsvRowFactory. Good idea?",
      options: [
        "No: both halves change when the CSV format changes, so it is one responsibility; splitting adds ravioli code",
        "Yes: every class should do exactly one thing",
        "Yes: four classes are always easier to test than one",
        "No: SRP only applies to classes with a database"
      ],
      answer: 0,
      hint: "Do parsing and formatting change for different reasons here?",
      explain:
        "Parsing and formatting the same CSV change together, for one reason. Splitting would spread a small idea over four files with no benefit. SRP is about reasons to change, not \"one thing\", and it applies to every class, not just database code."
    }
  ]
};

export default guide;
