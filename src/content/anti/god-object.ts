import type { Guide } from "../guides/types";
import beforePy from "./code/god-object-before.py?raw";
import beforeScala from "./code/god-object-before.scala?raw";
import afterPy from "./code/god-object-after.py?raw";
import afterScala from "./code/god-object-after.scala?raw";

const guide: Guide = {
  section: "anti",
  id: "god-object",
  order: 1,
  title: "God object",
  short: "One class that knows everything and does everything, so every change lands in it.",
  lede:
    "A **god object** is one class that has grown to own most of the program: its data, its rules and its side effects " +
    "(saving, emailing, logging). It starts as a handy place to put things. It ends as the file nobody wants to touch.",
  blocks: [
    {
      type: "text",
      text:
        "The idea in plain words: a class should have one reason to change. A god object has ten. Prices, stock, orders, " +
        "emails and reports all live in one place, so any change to any of them means opening the same big class, " +
        "re-reading all of it, and hoping you did not break the other nine jobs. It usually has a vague name: " +
        "`Manager`, `Helper`, `Util`, `System`, `App`, `Main`."
    },
    {
      type: "list",
      title: "What it looks like",
      style: "crosses",
      items: [
        "A class with hundreds of lines and 20+ methods that have little to do with each other.",
        "Fields for unrelated things side by side: `prices`, `stock`, `orders`, `outbox`, `smtp_host`.",
        "One long method with comments like `# pricing rules`, `# stock`, `# email` marking the jobs inside it.",
        "Every other class calls it, and it calls everything; it sits in the middle of every diagram.",
        "Its tests need the whole world set up (a database, a mail server) to check one small rule."
      ]
    },
    {
      type: "callout",
      tone: "warn",
      title: "The change request that exposes it",
      text:
        "Marketing asks: \"Give a 10% discount only to loyalty members, and send an SMS instead of an email to people who " +
        "prefer it.\" Both changes land in `place_order`. Two developers edit the same method in the same week, and their " +
        "changes collide. To test the discount you must also build stock, orders and an outbox, because they are all " +
        "tangled in one method."
    },
    {
      type: "compare",
      before: {
        title: "Before: ShopManager does everything",
        text:
          "One class holds prices, stock, orders and emails. `place_order` mixes four jobs, marked only by comments. " +
          "A pricing change and an email change both edit the same lines.",
        code: { python: beforePy, scala: beforeScala },
        uml: {
          classes: [
            { name: "ShopManager", kind: "concrete", members: ["- prices / stock / orders / outbox", "+ place_order(email, items)", "+ restock(name, qty)", "+ sales_report()"] }
          ],
          relations: []
        }
      },
      after: {
        title: "After: small classes, one coordinator",
        text:
          "`Pricing`, `Inventory`, `OrderBook` and `Mailer` each own one job and their own data. `Checkout` only decides " +
          "the order of the steps. The loyalty discount now touches `Pricing` alone; SMS means a second class next to `Mailer`.",
        code: { python: afterPy, scala: afterScala },
        uml: {
          classes: [
            { name: "Checkout", kind: "concrete", members: ["+ place_order(email, items)"] },
            { name: "Pricing", kind: "concrete", members: ["+ total(items)"] },
            { name: "Inventory", kind: "concrete", members: ["+ missing(items)", "+ take(items)"] },
            { name: "OrderBook", kind: "concrete", members: ["+ save(email, total)"] },
            { name: "Mailer", kind: "concrete", members: ["+ send(to, text)"] }
          ],
          relations: [
            { from: "Checkout", to: "Pricing", type: "association" },
            { from: "Checkout", to: "Inventory", type: "association" },
            { from: "Checkout", to: "OrderBook", type: "association" },
            { from: "Checkout", to: "Mailer", type: "association" }
          ]
        }
      }
    },
    {
      type: "list",
      title: "How to spot it in code",
      style: "plain",
      items: [
        "**The name test:** you can't describe the class in one sentence without the word \"and\".",
        "**The field-group test:** draw which methods use which fields. If they split into islands (methods A–C use `prices`, D–F use `outbox`), each island is a class waiting to get out.",
        "**The import test:** the file imports the database driver, the mail library, the PDF library and the HTTP client.",
        "**The churn test:** version control shows this file in most commits, for unrelated reasons.",
        "**The test-setup test:** checking one rule needs ten lines of setup for things the rule doesn't use."
      ]
    },
    {
      type: "callout",
      tone: "tip",
      title: "When it's acceptable",
      text:
        "A short script, a prototype you will throw away, or a `main` that only wires objects together can be one big " +
        "piece, and that's fine. Also don't split too early: three tiny classes that always change together are worse " +
        "than one class of 80 lines. Split along the lines where changes actually happen, not by a line count."
    },
    {
      type: "list",
      title: "Principles that fix it",
      style: "ticks",
      items: [
        "**Single Responsibility:** one reason to change per class. Pricing changes for marketing reasons; emails change for customer-service reasons.",
        "**High cohesion:** keep together the data and the methods that use it (stock and the stock rules).",
        "**Composition:** the coordinator holds the small parts and calls them; it holds no business rules of its own.",
        "**Refactor in steps:** move one island of fields + methods at a time into a new class, run the tests, repeat."
      ]
    },
    {
      type: "patterns",
      title: "Patterns that help",
      items: [
        { slug: "facade", how: "`Checkout` is a small facade: callers still get one `place_order` call, while the work is split into parts behind it." },
        { slug: "strategy", how: "Rules that vary (discounts, delivery fees) move out into swappable strategy objects instead of more `if`s in the big class." },
        { slug: "observer", how: "\"After an order, email / SMS / update the report\" becomes listeners, so the order code no longer knows every follow-up job." },
        { slug: "mediator", how: "When parts must talk to each other, a mediator keeps those conversations in one small place instead of rebuilding a god object." }
      ]
    }
  ],
  quiz: [
    {
      type: "mcq",
      tag: "Concept",
      prompt: "Which sign most clearly points to a god object?",
      hint: "Think about how many reasons the class has to change.",
      options: [
        "A class with 400 lines that handles pricing, stock, emails and reports",
        "A class with 400 lines that parses one file format",
        "A small class that is used by many other classes",
        "A class with a single public method"
      ],
      answer: 0,
      explain:
        "A god object is about too many unrelated jobs, not size alone. A long parser for one format has one reason to change. " +
        "Being used by many classes is normal for a small, focused class (like Money). One public method says nothing about the jobs behind it."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "Which line shows this class has taken on a job that belongs somewhere else?",
      hint: "Look for a side effect that has nothing to do with stock.",
      code: {
        lang: "python",
        text: [
          "class Inventory:",
          "    def __init__(self, stock: dict[str, int]) -> None:",
          "        self._stock = stock",
          "",
          "    def take(self, name: str, qty: int) -> None:",
          "        self._stock[name] -= qty",
          "        smtp_send(\"warehouse@shop.in\", f\"{name} now {self._stock[name]}\")"
        ].join("\n")
      },
      answer: 7,
      explain:
        "Line 7 sends an email from inside the stock class. Now a mail-server change edits Inventory, and every stock test needs a fake mail server. " +
        "Line 6 is the stock rule itself, which belongs here. A better design lets Inventory report the change and leaves the email to a notifier."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "You must split a 900-line OrderManager. What is the safest first step?",
      hint: "Small moves that keep the program working.",
      options: [
        "Rewrite it from scratch as six new classes over one weekend",
        "Find one group of fields and the methods that use only them, and move that group into a new class",
        "Split it into two files of 450 lines each",
        "Turn every method into a static function"
      ],
      answer: 1,
      explain:
        "Moving one cohesive island (fields + the methods that use them) is small, testable and keeps the code working. " +
        "A big-bang rewrite loses hidden rules. Splitting by line count keeps the jobs tangled across two files. Static functions remove the class but keep all the jobs in one place."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "In the \"after\" design, what should Checkout contain?",
      hint: "It is the one place that knows the order of the steps.",
      code: {
        lang: "scala",
        text: [
          "class Checkout(pricing: Pricing, inventory: Inventory, book: OrderBook, mailer: Mailer):",
          "  def placeOrder(email: String, items: Map[String, Int]): String = ???"
        ].join("\n")
      },
      options: [
        "The discount rules, so they are easy to find",
        "Only the order of the calls: check stock, price, take stock, save, notify",
        "A copy of the stock map, for speed",
        "The SMTP settings for the mailer"
      ],
      answer: 1,
      explain:
        "A coordinator should hold the sequence, not the rules. Discount rules belong in Pricing, stock data in Inventory, mail settings in Mailer. " +
        "Putting any of them back into Checkout starts growing a new god object."
    },
    {
      type: "order",
      tag: "Put in order",
      prompt: "Put these steps for taking apart a god object in a sensible order.",
      hint: "Safety net first; delete last.",
      steps: [
        "Write tests around the current behaviour",
        "Group fields and the methods that use them into islands",
        "Move one island into a new class and pass it in",
        "Run the tests and commit",
        "Repeat until the old class only coordinates"
      ],
      shuffled: [2, 0, 4, 1, 3],
      explain:
        "Tests come first so you notice when a move changes behaviour. Finding the islands tells you what to move. Each move is small and is checked before the next one. " +
        "The old class shrinks until it only wires the parts together; doing it the other way round means refactoring with no safety net."
    }
  ]
};

export default guide;
