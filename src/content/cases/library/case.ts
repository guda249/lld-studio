import type { CaseStudy } from "../../extras/types";
import python from "./code/main.py?raw";
import scala from "./code/Main.scala?raw";

const study: CaseStudy = {
  slug: "library",
  title: "Library management system",
  difficulty: 2,
  tagline: "Books and copies, loans with due dates, holds, late fines and different membership plans.",
  prompt:
    "Design the software for a public library. Members search the catalogue, borrow copies, return them, and reserve a book when every copy is out. Late returns cost a fine, and students get a different deal from regular members.",
  clarify: [
    { q: "Is a 'book' one title or one physical item?", a: "Both exist: a Book is the title (ISBN, author); a BookCopy is one item on the shelf. Loans and holds are about copies; search is about books." },
    { q: "How many kinds of members are there, and what differs?", a: "Standard and Student today. They differ in how many books they may hold, the loan length and the fine rule. More plans (senior, staff) are likely." },
    { q: "How does a hold work?", a: "If no copy is on the shelf, a member joins a first-come queue for that title. When a copy comes back, it is kept for the first person in the queue and they are told." },
    { q: "What blocks borrowing?", a: "Any unpaid fine, or already having the plan's maximum number of loans." },
    { q: "How do we model time?", a: "Days are plain integers passed into each call (today = 20). No clock inside the design, so tests and the demo are repeatable." },
    { q: "How are members told about things?", a: "Through a notification channel we don't own yet (SMS, e-mail). The design must not depend on which one." }
  ],
  requirements: {
    functional: [
      "Add books with any number of copies, and search by title or author",
      "Borrow a copy, with a due date that depends on the member's plan",
      "Return a copy and charge a late fine based on the member's plan",
      "Reserve a title when no copy is free; keep the next returned copy for the first person waiting",
      "Report a copy lost and charge a replacement fee",
      "Refuse to lend when the member owes money or is at the loan limit"
    ],
    nonFunctional: [
      "A new membership plan is a new class; borrowing and returning code stays the same",
      "A new notification channel is a new listener",
      "The desk only talks to one class (Library), so the inner parts can change freely"
    ],
    outOfScope: ["Payments through a real gateway", "Inter-library loans", "Persistence, login and a web API", "E-books"]
  },
  entities: [
    { name: "Library", responsibility: "The one entry point: borrow, return, reserve, report lost, pay. Coordinates everything else." },
    { name: "Catalog", responsibility: "Holds the books and their copies; search, and find copies of a title." },
    { name: "Book", responsibility: "A title: ISBN, title, author. A value that never changes." },
    { name: "BookCopy", responsibility: "One physical item and its status (available, on hold, borrowed, lost)." },
    { name: "Member", responsibility: "A person with a membership plan and any fines due." },
    { name: "MembershipPlan", responsibility: "Loan limit, loan length and fine rule. StandardPlan and StudentPlan are the variants." },
    { name: "Loan", responsibility: "Which member has which copy, the due day, and the day it came back." },
    { name: "LibraryListener", responsibility: "Anything that delivers notices to members (NoticeBoard here; SMS or e-mail later)." }
  ],
  uml: {
    classes: [
      { name: "Library", kind: "concrete", members: ["- catalog: Catalog", "- loans: list[Loan]", "+ borrow(member, isbn, today)", "+ return_copy(copy_id, today)", "+ reserve(member, isbn)"] },
      { name: "Catalog", kind: "concrete", members: ["+ add(book, count)", "+ search(text)", "+ copies_of(isbn)"] },
      { name: "Book", kind: "concrete", members: ["+ isbn: str", "+ title: str", "+ author: str"] },
      { name: "BookCopy", kind: "concrete", members: ["+ copy_id: str", "+ status: CopyStatus", "+ held_for: str | None"] },
      { name: "CopyStatus", kind: "enum", members: ["AVAILABLE", "ON_HOLD", "BORROWED", "LOST"] },
      { name: "Member", kind: "concrete", members: ["+ plan: MembershipPlan", "+ fines_due: int"] },
      { name: "MembershipPlan", kind: "interface", members: ["+ max_loans()", "+ loan_days()", "+ fine_for(days_late)"] },
      { name: "StandardPlan", kind: "concrete" },
      { name: "StudentPlan", kind: "concrete" },
      { name: "Loan", kind: "concrete", members: ["+ due_day: int", "+ returned_day: int | None"] },
      { name: "LibraryListener", kind: "interface", members: ["+ on_notice(member, message)"] },
      { name: "NoticeBoard", kind: "concrete" }
    ],
    relations: [
      { from: "Library", to: "Catalog", type: "composition" },
      { from: "Library", to: "Loan", type: "aggregation" },
      { from: "Library", to: "Member", type: "aggregation" },
      { from: "Library", to: "LibraryListener", type: "aggregation" },
      { from: "Catalog", to: "Book", type: "aggregation" },
      { from: "Catalog", to: "BookCopy", type: "aggregation" },
      { from: "BookCopy", to: "Book", type: "association" },
      { from: "BookCopy", to: "CopyStatus", type: "association" },
      { from: "Loan", to: "BookCopy", type: "association" },
      { from: "Loan", to: "Member", type: "association" },
      { from: "Member", to: "MembershipPlan", type: "association" },
      { from: "StandardPlan", to: "MembershipPlan", type: "realization" },
      { from: "StudentPlan", to: "MembershipPlan", type: "realization" },
      { from: "NoticeBoard", to: "LibraryListener", type: "realization" },
      { from: "LibraryListener", to: "Member", type: "dependency" }
    ]
  },
  flow: {
    title: "Returning a late copy that someone is waiting for",
    sequence: {
      label: "The desk returns a copy; Library closes the loan, asks the member's plan for the fine, keeps the copy for the next person in the hold queue and tells both members through the notice board.",
      participants: [
        { id: "desk", name: "Desk", kind: "client" },
        { id: "lib", name: "Library", kind: "concrete" },
        { id: "loan", name: "Loan", kind: "concrete" },
        { id: "plan", name: "StandardPlan", kind: "concrete" },
        { id: "copy", name: "BookCopy", kind: "concrete" },
        { id: "board", name: "NoticeBoard", kind: "concrete" }
      ],
      messages: [
        { from: "desk", to: "lib", label: "return_copy(\"C1\", today=20)" },
        { from: "lib", to: "loan", label: "returned_day = 20" },
        { from: "lib", to: "plan", label: "fine_for(5 days late)" },
        { from: "plan", to: "lib", label: "₹50", kind: "return" },
        { from: "lib", to: "board", label: "on_notice(Ravi, late fine ₹50)" },
        { from: "lib", to: "lib", label: "pop Meera from the hold queue", kind: "self" },
        { from: "lib", to: "copy", label: "status = ON_HOLD, held_for = Meera" },
        { from: "lib", to: "board", label: "on_notice(Meera, ready at desk)" },
        { from: "lib", to: "desk", label: "fine ₹50", kind: "return" }
      ]
    }
  },
  states: {
    name: "BookCopy status",
    states: ["Available", "Borrowed", "On hold", "Lost"],
    transitions: [
      { from: "Available", to: "Borrowed", on: "borrow" },
      { from: "Borrowed", to: "Available", on: "return, nobody waiting" },
      { from: "Borrowed", to: "On hold", on: "return, someone waiting" },
      { from: "On hold", to: "Borrowed", on: "the waiting member borrows" },
      { from: "Borrowed", to: "Lost", on: "report lost" }
    ]
  },
  patterns: [
    {
      slug: "strategy",
      where: "MembershipPlan with StandardPlan and StudentPlan; Member holds one, and Library asks it for max_loans, loan_days and fine_for.",
      why: "Plans are what the library changes most (a senior plan, a summer offer). Library never checks 'is this a student?', so a new plan is one new class."
    },
    {
      slug: "observer",
      where: "Library keeps a list of LibraryListener; NoticeBoard subscribes and receives on_notice calls.",
      why: "How members are told (board, SMS, e-mail) is decided later and may be several channels at once. Library only knows the listener interface."
    },
    {
      slug: "facade",
      where: "Library is the single entry point over Catalog, loans, the hold queues and fines.",
      why: "The desk app calls borrow / return_copy / reserve and never touches copies or queues directly, so the inside can be reorganised without changing the desk."
    }
  ],
  code: { python, scala },
  tradeoffs: [
    "We chose separate Book and BookCopy classes over one Book with a count because holds, loans and losses happen to one physical item, and a count can't say which copy Ravi has.",
    "We chose a plan object (Strategy) over a member_type field with if/else because limits and fines differ together; one class per plan keeps the rules for a plan in one place.",
    "We chose to keep a returned copy on hold for one named member over putting it back on the shelf because otherwise whoever walks in first wins, and the queue means nothing.",
    "We chose to pass today as a parameter over reading the system clock because due dates and fines are then easy to test and the demo prints the same thing every time.",
    "We chose a Facade (Library) over letting the desk use Catalog and Loan directly because the rules (fines block borrowing, holds win over the shelf) must be applied in one place."
  ],
  followUps: [
    { q: "A member on hold never comes to collect the book. What then?", a: "Store the day the hold started on the copy. A daily job (or the next borrow call) expires holds older than N days and passes the copy to the next person in the queue, or back to Available." },
    { q: "Two clerks lend the last copy at the same moment. How do you stop a double loan?", a: "Make 'find a free copy and mark it borrowed' one atomic step: a lock per title in memory, or a conditional update in the database (UPDATE … SET status = 'borrowed' WHERE id = ? AND status = 'available') and check that one row changed." },
    { q: "How does search scale to a million books?", a: "Keep Catalog behind the same interface but back it with an index: a search engine or a database full-text index on title and author. Library doesn't change, which is what the Facade buys us." },
    { q: "How would you add a renewal (extend the due date)?", a: "Library.renew(copy_id, today): refuse if someone is waiting for the title or the member owes money, else set due_day = today + plan.loan_days(). The plan can add a max_renewals() rule." },
    { q: "Where would you put 'remind me two days before the due date'?", a: "A daily job asks Library for loans due in two days and sends a notice through the same listeners. Reminders are just another kind of notice, so no new channel code is needed." }
  ],
  extend: [
    "Add a SeniorPlan: 4 books, 28 days, no fines at all. Nothing else should change.",
    "Add renew(copy_id, today) that refuses when someone is waiting for that title.",
    "Expire holds: if the waiting member hasn't borrowed within 3 days, pass the copy to the next person.",
    "Add an EmailListener that only forwards notices containing the word 'fine'."
  ],
  quiz: [
    {
      type: "mcq", tag: "Concept",
      prompt: "Why does the design have both Book and BookCopy?",
      options: [
        "Python dataclasses can't hold a status field",
        "A title can have several physical copies, and loans, holds and losses happen to one specific copy",
        "BookCopy is a Decorator that adds a status to Book",
        "Search would be slower with one class"
      ],
      answer: 1,
      hint: "Ravi has copy C1 of Clean Code. What would be lost if there were only 'Clean Code, 1 left'?",
      explain: "Book is the title; BookCopy is the item on the shelf with its own status. With one class you can't tell which copy is lost or on hold for whom. Dataclasses can hold any field, BookCopy holds a Book rather than wrapping its interface, and search speed is not the reason."
    },
    {
      type: "bug", tag: "Find the problem",
      prompt: "A new plan was added like this. Tap the line that breaks the design.",
      code: { lang: "python", text: `class Library:
    def borrow(self, member: Member, isbn: str, today: int) -> Loan:
        copy = self._free_copy(isbn)
        days = 28 if member.name.startswith("Sr.") else member.plan.loan_days()
        loan = Loan(copy, member, today + days)
        self._loans.append(loan)
        return loan` },
      answer: 4,
      hint: "Where should 'how long is a loan?' be answered?",
      explain: "Line 4 puts a plan rule inside Library and guesses the plan from the name. The loan length belongs to MembershipPlan: add a SeniorPlan whose loan_days() returns 28. The other lines only use what the plan and the catalog give them."
    },
    {
      type: "order", tag: "Put in order",
      prompt: "Meera reserved Clean Code. Put the events in order, from Ravi's late return to Meera taking the book home.",
      steps: [
        "Library closes Ravi's loan and asks his plan for the fine",
        "Ravi is told about the ₹50 fine through the listeners",
        "Meera is taken from the front of the hold queue",
        "The copy becomes On hold for Meera and she is told",
        "Meera calls borrow and the copy becomes Borrowed"
      ],
      shuffled: [3, 0, 4, 2, 1],
      hint: "Follow return_copy line by line, then the next borrow call.",
      explain: "return_copy first closes the loan and charges the fine (telling Ravi), then looks at the hold queue, keeps the copy for Meera and tells her. Only her own borrow call moves the copy from On hold to Borrowed."
    },
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "The desk app only ever calls library.borrow, library.return_copy and library.reserve; it never touches Catalog or the hold queues. Which pattern is that?",
      options: ["Facade", "Proxy", "Mediator", "Adapter"],
      answer: 0,
      hint: "One simple entry point in front of several parts.",
      explain: "Library is a Facade: one simple interface over Catalog, loans, holds and fines. A Proxy stands in for one object with the same interface, a Mediator makes peer objects talk through it, and an Adapter converts one interface into another."
    }
  ]
};

export default study;
