import type { CaseStudy } from "../../extras/types";
import python from "./code/main.py?raw";
import scala from "./code/Main.scala?raw";

const study: CaseStudy = {
  slug: "splitwise",
  title: "Expense sharing (Splitwise)",
  difficulty: 2,
  tagline: "Split bills three ways, track who owes whom, and settle up in as few payments as possible.",
  prompt:
    "Design an expense-sharing app like Splitwise. Friends form a group, anyone can add a bill they paid, and the bill can be split equally, by exact amounts or by percentages. The app shows each person's balance and suggests how to settle up.",
  clarify: [
    { q: "Which ways of splitting a bill do we need?", a: "Equal, exact amounts and percentages. More may come later (shares, by item), so adding one must be cheap." },
    { q: "How do we handle money and rounding?", a: "Store amounts as whole paise (integers), never floats. When a bill doesn't divide evenly, the first people in the list pay one paisa more, so shares always add up to the total." },
    { q: "Are expenses always inside a group?", a: "Yes for this version. Everyone in an expense, payer included, must be a member of the group." },
    { q: "What does settling up mean?", a: "Suggest a short list of payments that brings everyone to zero. Recording a payment is just another expense: the debtor pays, and the whole amount belongs to the creditor." },
    { q: "Do we need currencies, receipts or reminders?", a: "No. One currency, no attachments, no notifications beyond an in-app activity feed." },
    { q: "Can an expense be edited or deleted?", a: "Not in the core design. We discuss it as a follow-up (it is a reverse expense plus a new one)." }
  ],
  requirements: {
    functional: [
      "Create a group with members",
      "Add an expense: who paid, how much, among whom, and how to split it",
      "Split equally, by exact amounts or by percentages, and reject splits that don't add up",
      "Show each member's net balance",
      "Suggest a list of payments that settles the group, and record those payments",
      "Keep an activity feed of every expense"
    ],
    nonFunctional: [
      "Money is exact: shares always add up to the bill, no floating-point drift",
      "A new split type is a new class; Group does not change",
      "Balances update in one place, so they never disagree with the feed"
    ],
    outOfScope: ["Multiple currencies and exchange rates", "Payments through a bank or UPI", "Persistence, login and a web API"]
  },
  entities: [
    { name: "User", responsibility: "A person, identified by id. A value: two Users with the same id and name are the same." },
    { name: "Group", responsibility: "Owns the members and the list of expenses; validates a new expense and tells its listeners." },
    { name: "Expense", responsibility: "An immutable record: who paid, the total, and each person's share." },
    { name: "SplitStrategy", responsibility: "Turns a total and a list of people into shares. EqualSplit, ExactSplit and PercentSplit are the variants." },
    { name: "ExpenseListener", responsibility: "Anything that reacts to a new expense." },
    { name: "BalanceSheet", responsibility: "Keeps one net number per person and computes a settle-up plan." },
    { name: "ActivityFeed", responsibility: "Keeps a readable line for every expense." }
  ],
  uml: {
    classes: [
      { name: "Group", kind: "concrete", members: ["- members: list[User]", "- expenses: list[Expense]", "+ subscribe(listener)", "+ add_expense(…, strategy)", "+ settle(debtor, creditor, amount)"] },
      { name: "User", kind: "concrete", members: ["+ user_id: str", "+ name: str"] },
      { name: "Expense", kind: "concrete", members: ["+ paid_by: User", "+ total: int", "+ shares: dict[User, int]"] },
      { name: "SplitStrategy", kind: "interface", members: ["+ split(total, users)"] },
      { name: "EqualSplit", kind: "concrete" },
      { name: "ExactSplit", kind: "concrete", members: ["- amounts: dict"] },
      { name: "PercentSplit", kind: "concrete", members: ["- percents: dict"] },
      { name: "ExpenseListener", kind: "interface", members: ["+ on_expense(expense)"] },
      { name: "BalanceSheet", kind: "concrete", members: ["- net: dict[User, int]", "+ balance_of(user)", "+ settle_up()"] },
      { name: "ActivityFeed", kind: "concrete", members: ["- lines: list[str]"] }
    ],
    relations: [
      { from: "EqualSplit", to: "SplitStrategy", type: "realization" },
      { from: "ExactSplit", to: "SplitStrategy", type: "realization" },
      { from: "PercentSplit", to: "SplitStrategy", type: "realization" },
      { from: "BalanceSheet", to: "ExpenseListener", type: "realization" },
      { from: "ActivityFeed", to: "ExpenseListener", type: "realization" },
      { from: "Group", to: "User", type: "aggregation" },
      { from: "Group", to: "Expense", type: "aggregation" },
      { from: "Group", to: "ExpenseListener", type: "aggregation" },
      { from: "Group", to: "SplitStrategy", type: "dependency" },
      { from: "Expense", to: "User", type: "association" },
      { from: "ExpenseListener", to: "Expense", type: "dependency" }
    ]
  },
  flow: {
    title: "Adding a bill split by percentages",
    sequence: {
      label: "The app adds an expense to the group; the group asks the split strategy for shares, creates the Expense, then tells the balance sheet and the activity feed.",
      participants: [
        { id: "app", name: "App", kind: "client" },
        { id: "group", name: "Group", kind: "concrete" },
        { id: "split", name: "PercentSplit", kind: "concrete" },
        { id: "exp", name: "Expense", kind: "concrete" },
        { id: "sheet", name: "BalanceSheet", kind: "concrete" },
        { id: "feed", name: "ActivityFeed", kind: "concrete" }
      ],
      messages: [
        { from: "app", to: "group", label: "add_expense(hotel, chen, 600000, all, split)" },
        { from: "group", to: "group", label: "check members and amount", kind: "self" },
        { from: "group", to: "split", label: "split(600000, users)" },
        { from: "split", to: "group", label: "shares {Asha: 240000, …}", kind: "return" },
        { from: "group", to: "exp", label: "new Expense(#3, …)", kind: "create" },
        { from: "group", to: "sheet", label: "on_expense(expense)" },
        { from: "group", to: "feed", label: "on_expense(expense)" },
        { from: "group", to: "app", label: "expense #3", kind: "return" }
      ]
    }
  },
  patterns: [
    {
      slug: "strategy",
      where: "SplitStrategy with EqualSplit, ExactSplit and PercentSplit; Group.add_expense takes one as a parameter.",
      why: "The way a bill is cut is the part that keeps growing (shares, by item, adjustments). Each rule is its own class, so a new one never touches Group or the balance code."
    },
    {
      slug: "observer",
      where: "Group keeps a list of ExpenseListener; BalanceSheet and ActivityFeed subscribe.",
      why: "Several things react to a new expense, and more will (reminders, monthly totals). Group only knows the listener interface, so adding a reaction is a new subscriber, not a new line in add_expense."
    }
  ],
  code: { python, scala },
  tradeoffs: [
    "We chose integer paise over floats because 1000.00 / 3 in floating point never adds back to exactly 1000.00, and money must balance to the last paisa.",
    "We chose to keep one net balance per person over a who-owes-whom matrix because settling up only needs the net numbers, and the matrix grows with the square of the group size.",
    "We chose a greedy settle-up (biggest debtor pays biggest creditor) over an exact minimum because the true minimum number of payments is a hard search problem; greedy needs at most n − 1 payments and is easy to explain.",
    "We chose to record a repayment as an ordinary expense over a separate Payment type because the balance maths is the same, so every listener handles it for free.",
    "We chose to pass the strategy into add_expense over storing a split type on Expense because the Expense only needs the result (the shares); it keeps the strategy's name as text for the feed."
  ],
  followUps: [
    { q: "How would you let someone edit or delete an expense?", a: "Keep expenses immutable. Deleting adds a reversing expense (same shares, negative), editing is a reversal plus a new expense. Listeners stay correct with no new code, and the history shows what changed." },
    { q: "What changes for multiple currencies?", a: "Store a currency on each Expense and keep balances per (user, currency). Settle up per currency, or convert at a fixed rate the group agrees on; never mix currencies in one number." },
    { q: "Two people add expenses at the same moment. What can go wrong?", a: "Both read and write the same net balances, so one update can be lost. In one process, lock add_expense per group; with a database, append expenses in a transaction and derive balances from them (or update them with atomic increments)." },
    { q: "How do you scale balances for a big group or many groups?", a: "Balances are a sum over expenses, so they can be recomputed at any time. Keep a cached balance per (group, user), update it on each new expense, and rebuild from the expense log if it is ever in doubt." },
    { q: "How would you add a 'split by shares' option (2 shares for Asha, 1 for Ben)?", a: "A new SharesSplit class that implements SplitStrategy: total × shares / sum of shares, with the same leftover rule. Group, Expense and the listeners do not change; that is the point of the Strategy." }
  ],
  extend: [
    "Add a SharesSplit strategy (for example Asha 2 shares, Ben 1, Chen 1) with the same rounding rule.",
    "Add a MonthlyTotals listener that sums what each person spent per month (give Expense a date string).",
    "Add delete_expense(expense_id) that records a reversing expense, and check that the balances return to where they were.",
    "Change settle_up so it ignores debts smaller than ₹1.00, and print what was skipped."
  ],
  quiz: [
    {
      type: "mcq", tag: "Concept",
      prompt: "Why does the design store ₹1000.00 as 100000 paise instead of 1000.0?",
      options: [
        "Integers are faster to print",
        "Shares must add up to the bill exactly, and floats can't represent most decimal amounts exactly",
        "Python and Scala have no decimal types",
        "Percent splits only work with integers"
      ],
      answer: 1,
      hint: "Try 1000.0 / 3 three times and add the results back up.",
      explain: "Binary floats can't hold values like 333.33 exactly, so sums drift by tiny amounts and balances never quite reach zero. Whole paise make every share exact. Printing speed is irrelevant, both languages do have decimal types, and percent splits work with any number type."
    },
    {
      type: "bug", tag: "Find the problem",
      prompt: "This EqualSplit loses money on some bills. Tap the line that causes it.",
      code: { lang: "python", text: `class EqualSplit(SplitStrategy):
    def label(self) -> str:
        return "equal"

    def split(self, total: int, users: list[User]) -> dict[User, int]:
        each = total // len(users)
        return {u: each for u in users}` },
      answer: 7,
      hint: "Split 100000 paise among 3 people. How much is assigned in total?",
      explain: "Line 7 gives everyone total // n, so 100000 among 3 assigns only 99999 and one paisa disappears. Line 6 is fine on its own; the fix is to hand the remainder (divmod) to the first people, so the shares add up to the total."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "Product asks for a 'remind people who owe more than ₹500' feature after every new expense. Where does it go?",
      options: [
        "A new branch at the end of Group.add_expense",
        "A new ReminderListener that implements ExpenseListener and subscribes to the group",
        "A new SplitStrategy that also sends reminders",
        "Inside BalanceSheet.on_expense"
      ],
      answer: 1,
      hint: "Which pattern already lets new reactions plug in without editing Group?",
      explain: "Group already notifies every ExpenseListener, so a new listener is the Observer way to add a reaction. Editing add_expense or BalanceSheet mixes unrelated jobs into them, and a split strategy should only compute shares."
    },
    {
      type: "order", tag: "Put in order",
      prompt: "Put the steps of add_expense in the right order.",
      steps: [
        "Check the amount is positive and everyone is in the group",
        "Ask the SplitStrategy for each person's share",
        "Create the Expense and append it to the group's list",
        "Call on_expense on every subscribed listener",
        "Return the new Expense"
      ],
      shuffled: [2, 0, 3, 1, 4],
      hint: "Validate first; notify only once the expense really exists.",
      explain: "Validation comes first so nothing half-done is stored. The shares are needed to build the Expense, and listeners are told only after it is saved, so the balance sheet and the feed always agree with the group's list."
    }
  ]
};

export default study;
