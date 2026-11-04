import type { Guide } from "../guides/types";
import beforePy from "./code/anemic-model-before.py?raw";
import beforeScala from "./code/anemic-model-before.scala?raw";
import afterPy from "./code/anemic-model-after.py?raw";
import afterScala from "./code/anemic-model-after.scala?raw";
import funcPy from "./code/anemic-model-functional.py?raw";
import funcScala from "./code/anemic-model-functional.scala?raw";

const guide: Guide = {
  section: "anti",
  id: "anemic-model",
  order: 5,
  title: "Anemic domain model",
  short: "Data classes with no behaviour, and all the rules in \"manager\" services that anyone can bypass.",
  lede:
    "An **anemic domain model** has classes like `Account` and `Order` that are only bags of fields, while every rule " +
    "about them lives somewhere else, in an `AccountManager` or `OrderService`. It looks tidy. The cost shows up when " +
    "a second service changes the same data and forgets one of the rules.",
  blocks: [
    {
      type: "text",
      text:
        "The idea in plain words: the **domain** is the part of the program about the business (accounts, orders, stock). " +
        "An object should protect its own data. If `Account` lets anyone write `balance` directly, then the rule " +
        "\"a frozen account can't lose money\" is only a hope: it holds as long as every piece of code that touches " +
        "`balance` remembers to check it. Moving the rule into `Account.withdraw()` makes it impossible to skip. " +
        "This is **encapsulation**: keep the data and the rules that guard it together, and hide the data."
    },
    {
      type: "list",
      title: "What it looks like",
      style: "crosses",
      items: [
        "Domain classes with only fields (plus getters and setters), and no methods that make decisions.",
        "Services named after a class: `AccountManager`, `OrderHelper`, `CustomerService`, full of `if account.x …` checks.",
        "Other classes reaching in to change fields: `order.status = \"shipped\"`, `account.balance -= fee`.",
        "The same check copied into several services (\"is it frozen?\" in withdraw, transfer and fees).",
        "Methods that take an object as the first argument and only touch that object's fields: `withdraw(account, amount)`."
      ]
    },
    {
      type: "callout",
      tone: "warn",
      title: "The change request that exposes it",
      text:
        "\"Charge a 200 late fee on overdue accounts.\" Another team writes `FeeService`, sets `account.balance -= 200`, " +
        "and ships. The rules \"frozen accounts can't lose money\" and \"no negative balance\" live in `AccountManager`, which they never opened. " +
        "A frozen account ends at -100, and nobody notices until the audit."
    },
    {
      type: "compare",
      before: {
        title: "Before: data here, rules over there",
        text:
          "`Account` is a plain record. `AccountManager.withdraw` checks the rules, but `FeeService` changes `balance` " +
          "directly and skips every one of them.",
        code: { python: beforePy, scala: beforeScala },
        uml: {
          classes: [
            { name: "AccountManager", kind: "concrete", members: ["+ withdraw(account, amount)"] },
            { name: "FeeService", kind: "concrete", members: ["+ charge_late_fee(account)"] },
            { name: "Account", kind: "concrete", members: ["+ owner", "+ balance", "+ frozen"] }
          ],
          relations: [
            { from: "AccountManager", to: "Account", type: "dependency" },
            { from: "FeeService", to: "Account", type: "dependency" }
          ]
        }
      },
      after: {
        title: "After: Account guards itself",
        text:
          "The balance is private and changes only through `withdraw()`, which checks both rules. `FeeService` still decides " +
          "when to charge, but it can only ask; it can't skip the checks. A new rule (say, a daily limit) goes in one method.",
        code: { python: afterPy, scala: afterScala },
        uml: {
          classes: [
            { name: "FeeService", kind: "concrete", members: ["+ charge_late_fee(account)"] },
            { name: "Account", kind: "concrete", members: ["- balance", "- frozen", "+ freeze()", "+ withdraw(amount)"] }
          ],
          relations: [{ from: "FeeService", to: "Account", type: "dependency" }]
        }
      }
    },
    {
      type: "list",
      title: "How to spot it in code",
      style: "plain",
      items: [
        "**Search for writes to another object's fields:** `something.balance =`, `order.status =` outside the class itself.",
        "**Look at method signatures in services.** If a method's first parameter is an `Account` and it only reads and writes that account, it wants to be `Account`'s own method.",
        "**Count the copies of a rule.** The same \"if frozen\" in three services means the rule has no home.",
        "**Ask the object a question.** If `Account` can't answer \"may I withdraw 500?\" by itself, its knowledge lives elsewhere."
      ]
    },
    {
      type: "callout",
      tone: "tip",
      title: "When plain data classes are fine",
      text:
        "Not every class needs behaviour. **Data transfer objects** (the shape of a JSON request or a database row) " +
        "should be plain. So should simple CRUD screens with no real rules, read-only reports, and events or messages. " +
        "Functional style is fine too: immutable records plus the functions that own their rules, kept in one module " +
        "(see below). The smell is mutable data with important rules, where any code can change the data without passing the rules."
    },
    {
      type: "code",
      title: "The functional middle way",
      code: { python: funcPy, scala: funcScala },
      note:
        "The record is immutable, so nobody can change a balance behind the rules' back, and withdraw is the one place that makes a new value. " +
        "This is a good fit in Scala (case class + companion object). To make it airtight, also stop callers from building an Account with any balance they like (a private constructor or a smart constructor)."
    },
    {
      type: "list",
      title: "Principles that fix it",
      style: "ticks",
      items: [
        "**Encapsulation:** hide the data; expose actions (`withdraw`, `freeze`) instead of setters.",
        "**Tell, don't ask:** tell the account to withdraw instead of asking for its balance and deciding outside.",
        "**Information Expert:** give a job to the class that has the data needed to do it.",
        "**Thin services:** keep services for work that spans several objects (transfer between two accounts, sending an email), not for one object's own rules."
      ]
    },
    {
      type: "patterns",
      title: "Patterns that help",
      items: [
        { slug: "state", how: "When an account behaves differently when active, frozen or closed, State moves those rules into the account's own state objects instead of `if status ==` in every service." },
        { slug: "facade", how: "The service layer becomes a thin facade: it loads objects, calls their methods in order and saves them, holding no business rules itself." },
        { slug: "observer", how: "The account announces \"withdrawn\" or \"frozen\" events; services that send texts or update reports listen, instead of poking at its fields." },
        { slug: "command", how: "Operations like Withdraw or ChargeFee can be command objects that call the account's methods, adding history and undo without moving the rules out." }
      ]
    }
  ],
  quiz: [
    {
      type: "mcq",
      tag: "Concept",
      prompt: "What makes a domain model \"anemic\"?",
      hint: "Where are the rules about the data?",
      options: [
        "The classes have fewer than five fields",
        "The classes hold data but no rules, and services outside change their fields directly",
        "The classes use dataclasses or case classes",
        "The classes have no constructor"
      ],
      answer: 1,
      explain:
        "Anemic means the objects can't protect themselves: the data is open and the rules live elsewhere, so they can be skipped. " +
        "Field count and constructors are not the issue. Dataclasses and case classes are fine, especially immutable ones; the trouble is mutable data with outside rules."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "Which line bypasses the account's rules?",
      hint: "Look for a direct write to another object's field.",
      code: {
        lang: "scala",
        text: [
          "class RefundService(log: List[String]):",
          "  def refund(order: Order, account: Account): Unit =",
          "    val amount = order.total",
          "    account.balance += amount",
          "    println(s\"refunded $amount\")"
        ].join("\n")
      },
      answer: 4,
      explain:
        "Line 4 changes the balance directly, so rules like \"closed accounts can't receive money\" are skipped. Use account.deposit(amount), which checks them. " +
        "Reading order.total on line 3 is fine, and line 5 only prints."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "Which of these is a fine place for a plain data class with no behaviour?",
      hint: "Data that only crosses a boundary.",
      options: [
        "A bank Account that many services withdraw from",
        "The JSON body of a \"create user\" request, before it is checked",
        "An Order whose status changes through several rules",
        "A Stock item with a minimum-quantity rule"
      ],
      answer: 1,
      explain:
        "A request body is a data transfer object: it carries values across a boundary and has no rules of its own yet. " +
        "Accounts, orders and stock items all have rules that must hold every time their data changes, so they should guard their own data."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "After the refactor, what is FeeService still responsible for?",
      hint: "When versus whether.",
      code: {
        lang: "python",
        text: [
          "class FeeService:",
          "    def charge_late_fee(self, account: Account) -> str:",
          "        return account.withdraw(200)"
        ].join("\n")
      },
      options: [
        "Checking whether the account is frozen",
        "Deciding when a late fee applies and asking the account to pay it",
        "Storing the account's balance",
        "Nothing; it should be deleted"
      ],
      answer: 1,
      explain:
        "The service keeps the business process (when to charge), and Account keeps its own rules (whether money may leave). " +
        "The frozen check and the balance now belong to Account. The service is still useful because \"late fee\" is a process, not an account rule."
    },
    {
      type: "order",
      tag: "Put in order",
      prompt: "Order the steps to give an anemic Account its behaviour back.",
      hint: "Move the rule in before you lock the door.",
      steps: [
        "Find every place that writes to account.balance",
        "Add a withdraw method to Account with the rules from AccountManager",
        "Change each caller to use account.withdraw",
        "Make balance private (read-only from outside)",
        "Delete the now-empty AccountManager.withdraw"
      ],
      shuffled: [3, 0, 4, 1, 2],
      explain:
        "First learn who writes the field, then give Account the method, then move callers onto it. Only then can the field be made private without breaking anything, " +
        "and the old manager method is removed last, when no caller needs it."
    }
  ]
};

export default guide;
