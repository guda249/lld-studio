/**
 * UML Basics, lesson 4: multiplicity. 1, 0..1, *, 1..* and ranges; where the numbers sit on an association and what
 * they become in code. Every code file runs as-is.
 *
 * Class sketches can't carry multiplicity on line ends, so these diagrams are flow diagrams: two plain class boxes
 * (name compartment only) joined by an association with the numbers at its ends, and a note with the code shape.
 * A second, identical line in the opposite direction carries the number at the near end.
 */
import type { FlowSpec, UmlLesson } from "../../guides/types";
import endsPy from "./code/multiplicity-ends.py?raw";
import endsScala from "./code/multiplicity-ends.scala?raw";
import onePy from "./code/multiplicity-one.py?raw";
import oneScala from "./code/multiplicity-one.scala?raw";
import optPy from "./code/multiplicity-optional.py?raw";
import optScala from "./code/multiplicity-optional.scala?raw";
import manyPy from "./code/multiplicity-many.py?raw";
import manyScala from "./code/multiplicity-many.scala?raw";
import oomPy from "./code/multiplicity-one-or-more.py?raw";
import oomScala from "./code/multiplicity-one-or-more.scala?raw";
import rangePy from "./code/multiplicity-range.py?raw";
import rangeScala from "./code/multiplicity-range.scala?raw";

/** Two class boxes, one above the other, joined by an association; `far` sits next to the lower class. */
function pair(o: { top: string; bottom: string; far: string; near?: string; note: string; label: string }): FlowSpec {
  const h = o.note.split("\n").length * 16 + 24;
  const spec: FlowSpec = {
    width: 360,
    height: Math.max(252, 226 + h / 2 + 8),
    label: o.label,
    nodes: [
      { id: "a", kind: "boundary", label: o.top, x: 0, y: 10, w: 120, h: 32 },
      { id: "b", kind: "boundary", label: o.bottom, x: 0, y: 210, w: 120, h: 32 },
      { id: "note", kind: "note", label: o.note, x: 150, y: 226 - h / 2, w: 210, h }
    ],
    edges: [
      { id: "line", from: "a", to: "b", label: o.far, labelAt: [72, 200], arrow: o.near ? "none" : "open" },
      { id: "link", from: "note", to: "b", dashed: true, arrow: "none" }
    ]
  };
  if (o.near) spec.edges.push({ id: "back", from: "b", to: "a", label: o.near, labelAt: [72, 62], arrow: "none" });
  return spec;
}

const lesson: UmlLesson = {
  id: "multiplicity",
  order: 4,
  title: "Multiplicity",
  lede:
    "Multiplicity says **how many**: how many objects of one class can be linked to one object of the other. " +
    "It is a small number or range written at the end of an association line, like `1`, `0..1`, `*` or `1..*`. " +
    "Each one turns into a clear shape in code: a required argument, an optional field or a list.",
  concepts: [
    {
      id: "ends",
      name: "Where it sits",
      short: "Read each number at the far end of the line",
      notation: "1 — 0..*",
      visual: {
        kind: "flow",
        spec: pair({
          top: "Customer", bottom: "Order", far: "0..*", near: "1",
          note: "Customer has 0..* Orders\nOrder has exactly 1\nCustomer",
          label: "Customer and Order joined by a line: 0..* next to Order, 1 next to Customer."
        })
      },
      scene: [
        { say: "Two classes, one association. Multiplicity answers: for ONE object at this end, how many objects at the other end?", show: ["a", "b"] },
        { say: "Start at Customer and read the number next to Order: one customer has zero or more orders.", show: ["line"] },
        { say: "Now start at Order and read the number next to Customer: every order belongs to exactly one customer.", show: ["back"] },
        { say: "So each number describes the class it sits next to, counted from the other side. That is why the code differs at each end.", show: ["note", "link"] }
      ],
      what:
        "Multiplicity is written at the **end** of an association, next to the class being counted. " +
        "Read it as \"one A is linked to this many B\". Each end has its own number, so one line answers two questions.",
      spot: "Look at the type of the field on each side. Customer holds a `list[Order]` (many); Order holds a single `Customer` (one).",
      when:
        "Add multiplicities to every association that matters. They catch design mistakes early: \"can an order exist without a customer?\" is a question the number must answer.",
      code: { python: endsPy, scala: endsScala },
      hl: { python: [4, 10], scala: [4, 6] }
    },
    {
      id: "one",
      name: "Exactly one",
      short: "1: always there, a required argument",
      notation: "1",
      visual: {
        kind: "flow",
        spec: pair({
          top: "Ticket", bottom: "Vehicle", far: "1",
          note: "required argument:\nTicket(vehicle)\nnever None",
          label: "Ticket to Vehicle with multiplicity 1 next to Vehicle."
        })
      },
      scene: [
        { say: "A parking ticket is always for one vehicle. Not zero, not two.", show: ["a", "b"] },
        { say: "So the line gets a 1 next to Vehicle. If no number is shown at all, most readers also assume 1.", show: ["line"] },
        { say: "In code, exactly one means a required constructor argument: you can't create a Ticket without a Vehicle.", show: ["note", "link"] }
      ],
      what:
        "`1` means exactly one, at all times. The linked object must exist from the moment the owner is created, and there is only ever one of it.",
      spot: "A constructor parameter with no default value, stored in a field that is never `None` / `null` and is not a collection.",
      when:
        "For things an object can't make sense without: an order's customer, a ticket's vehicle, a move's player. Enforcing it in the constructor saves `None` checks everywhere else.",
      code: { python: onePy, scala: oneScala },
      hl: { python: [7, 8], scala: [3] }
    },
    {
      id: "optional",
      name: "Zero or one",
      short: "0..1: maybe there, an optional field",
      notation: "0..1",
      visual: {
        kind: "flow",
        spec: pair({
          top: "Person", bottom: "Passport", far: "0..1",
          note: "optional field:\nPython: Passport | None\nScala: Option[Passport]",
          label: "Person to Passport with multiplicity 0..1 next to Passport."
        })
      },
      scene: [
        { say: "A person may have a passport, or may not. They can't have two valid ones.", show: ["a", "b"] },
        { say: "So the end reads 0..1: at least zero, at most one. The two dots mean \"up to\".", show: ["line"] },
        { say: "In code it is an optional field. Because zero is allowed, every use must check whether the passport is there.", show: ["note", "link"] }
      ],
      what:
        "`0..1` means zero or one: the link is optional. The lower number is the minimum and the upper number is the maximum.",
      spot: "Python: a field typed `X | None`, often with `= None` as default. Scala: an `Option[X]` field, `None` by default. Look for `is not None` or `.isDefined` checks.",
      when:
        "For links that may be missing: a user's profile photo, a parking spot's current vehicle, a task's assignee. If you find yourself checking for `None` everywhere, ask if it should be `1`.",
      code: { python: optPy, scala: optScala },
      hl: { python: [7, 12], scala: [3, 4] }
    },
    {
      id: "many",
      name: "Many",
      short: "* (0..*): any number, a list that may be empty",
      notation: "*",
      visual: {
        kind: "flow",
        spec: pair({
          top: "Playlist", bottom: "Song", far: "*",
          note: "a list, may be empty:\nPython: list[Song]\nScala: ListBuffer[Song]",
          label: "Playlist to Song with multiplicity * next to Song."
        })
      },
      scene: [
        { say: "A playlist holds songs: none at first, then as many as you like.", show: ["a", "b"] },
        { say: "The star means many: zero or more, with no upper limit. 0..* means exactly the same thing.", show: ["line"] },
        { say: "In code it is a collection field that starts empty. Methods like add put objects into it.", show: ["note", "link"] }
      ],
      what:
        "`*` (or `0..*`) means zero or more. There is no maximum, and an empty collection is perfectly valid.",
      spot: "A field holding a `list`, `set`, `dict` (Python) or `List`, `Set`, `Map`, `ListBuffer` (Scala), usually starting empty, plus `add` / `remove` methods.",
      when:
        "Whenever an object collects others: a cart's items, a team's members, a parking floor's spots. Pick `1..*` instead if an empty collection makes no sense.",
      code: { python: manyPy, scala: manyScala },
      hl: { python: [8, 11], scala: [6, 7] }
    },
    {
      id: "one-or-more",
      name: "One or more",
      short: "1..*: a list that is never empty",
      notation: "1..*",
      visual: {
        kind: "flow",
        spec: pair({
          top: "Order", bottom: "OrderLine", far: "1..*",
          note: "never empty:\nOrder(first, *more)\nor a check in __init__",
          label: "Order to OrderLine with multiplicity 1..* next to OrderLine."
        })
      },
      scene: [
        { say: "An order with no lines is not an order. It must hold at least one line, and may hold many.", show: ["a", "b"] },
        { say: "So the end reads 1..*: the minimum is one, and there is no maximum.", show: ["line"] },
        { say: "In code, ask for the first line separately, or check the list in the constructor. Either way an empty order can't be created.", show: ["note", "link"] }
      ],
      what:
        "`1..*` means one or more. It is a list with a rule: it must never be empty, from creation onwards.",
      spot: "A constructor that takes a first item plus more (`first, *more` in Python, `first, more*` in Scala), or a `require(items.nonEmpty)` / `if not items: raise` check.",
      when:
        "When an empty collection would be a broken object: an order's lines, a poll's options, a route's stops. Putting the rule in the constructor keeps every later method simpler.",
      code: { python: oomPy, scala: oomScala },
      hl: { python: [8, 9], scala: [3, 4] }
    },
    {
      id: "range",
      name: "Ranges",
      short: "2..4, 0..3, or an exact number like 4",
      notation: "2..4",
      visual: {
        kind: "flow",
        spec: pair({
          top: "Game", bottom: "Player", far: "2..4",
          note: "a list plus a check:\nif not 2 <= len <= 4:\n    raise ValueError",
          label: "Game to Player with multiplicity 2..4 next to Player."
        })
      },
      scene: [
        { say: "A board game needs at least two players and has room for four.", show: ["a", "b"] },
        { say: "Any min..max pair works: 2..4 here. A single number is exact, so a car has 4 wheels.", show: ["line"] },
        { say: "No type in Python or Scala can say \"two to four\", so the code keeps a list and checks its size in the constructor.", show: ["note", "link"] }
      ],
      what:
        "Write any range as `min..max` (`2..4`, `0..3`) or one exact number (`4`). The upper bound can be `*` for no limit, as in `2..*`.",
      spot: "A collection plus a size check: `if not 2 <= len(players) <= 4: raise ValueError(...)` in Python, `require(players.size >= 2 && players.size <= 4)` in Scala.",
      when:
        "Only when the limits are real business rules (seats in a car, players in a game). Don't invent limits just to look precise: most links are `1`, `0..1` or `*`.",
      code: { python: rangePy, scala: rangeScala },
      hl: { python: [8, 9], scala: [4, 5] }
    }
  ],
  practiceTitle: "Count the ends",
  practice: [
    {
      type: "mcq",
      tag: "Read the diagram",
      prompt: "A line joins `Library` and `Book`. Next to Book it says `*`; next to Library it says `1`. What does it mean?",
      options: [
        "Each library has any number of books, and each book belongs to exactly one library",
        "Each library has exactly one book, and each book is in many libraries",
        "There are many libraries and only one book",
        "Books are optional for libraries, and libraries are optional for books"
      ],
      answer: 0,
      hint: "Each number describes the class it sits next to, counted from the other side.",
      explain:
        "Start at Library and read the number next to Book: `*`, so any number of books. Start at Book and read the number next to Library: `1`, so exactly one library. " +
        "The second option reads the numbers at the wrong ends, and the last ignores the `1`."
    },
    {
      type: "mcq",
      tag: "Read the code",
      prompt: "Which multiplicity does this code give the Driver end of Car → Driver?",
      code: { lang: "python", text: "class Driver:\n    pass\n\nclass Car:\n    def __init__(self, driver: Driver | None = None):\n        self.driver = driver\n\nprint(Car().driver)" },
      options: ["1", "0..1", "*", "1..*"],
      answer: 1,
      hint: "Can a Car exist with no driver? Can it have two?",
      explain:
        "`Driver | None = None` means the field may be empty but holds at most one driver: **0..1**. " +
        "`1` would need a required argument, and `*` or `1..*` would need a collection."
    },
    {
      type: "mcq",
      tag: "Read the code",
      prompt: "What multiplicity does `stops` give the Stop end of Route → Stop?",
      code: {
        lang: "scala",
        text: "class Stop(val name: String)\n\nclass Route(first: Stop, more: Stop*):\n  val stops: List[Stop] = first :: more.toList\n\n@main def demo(): Unit = println(Route(Stop(\"A\"), Stop(\"B\")).stops.size)"
      },
      options: ["0..1", "*", "1..*", "2..*"],
      answer: 2,
      hint: "How many stops must you pass at least?",
      explain:
        "The constructor demands a `first` stop and then any number more, so a route always has at least one: `1..*`. " +
        "`*` would also allow zero; `2..*` would need two required stops; `0..1` is a single optional field."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "A chess game has exactly two players. What do you write next to Player on the Game — Player line?",
      options: ["2", "*", "1..*", "0..2"],
      answer: 0,
      hint: "When the minimum and maximum are the same, you only write one number.",
      explain:
        "Exactly two is written as **2** (the short form of `2..2`). `*` and `1..*` allow too many, and `0..2` allows a game with no players."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "The diagram says every Invoice has exactly 1 Customer. Which line breaks that rule?",
      code: {
        lang: "python",
        text:
          "class Customer:\n    def __init__(self, name: str):\n        self.name = name\n\nclass Invoice:\n    def __init__(self, customer: Customer | None = None):\n        self.customer = customer\n\nprint(Invoice(Customer(\"Asha\")).customer.name)"
      },
      answer: 6,
      hint: "What happens when someone calls `Invoice()` with no arguments?",
      explain:
        "Line 6 makes the customer optional (`| None = None`), which is **0..1**, not 1. For exactly one, the parameter must be required: `customer: Customer`. " +
        "Line 7 only stores what it is given, and the other lines are fine."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "The diagram says a Team has 1..* Members. Which line lets an empty team be created?",
      code: {
        lang: "scala",
        text:
          "class Member(val name: String)\n\nclass Team(val members: List[Member]):\n  def size: Int = members.size\n\n@main def demo(): Unit =\n  println(Team(Nil).size)"
      },
      answer: 3,
      hint: "Which line should enforce \"at least one\"?",
      explain:
        "Line 3 accepts any `List`, including an empty one, so it only says `*`. Add `require(members.nonEmpty)` or take `first: Member, more: Member*`. " +
        "Line 7 shows the problem (an empty team), but the rule belongs in the class, not in every caller."
    },
    {
      type: "order",
      tag: "Put in order",
      prompt: "Order these multiplicities from the strictest (fewest choices) to the loosest:",
      steps: ["1", "0..1", "1..*", "*"],
      shuffled: [3, 1, 0, 2],
      hint: "Count how many different sizes each one allows.",
      explain:
        "`1` allows a single size. `0..1` allows two sizes (zero or one). `1..*` allows any size except zero, and `*` allows every size including zero. " +
        "Prefer the strictest one that is true: it gives the code the most rules for free."
    }
  ]
};

export default lesson;
