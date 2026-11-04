/**
 * UML Basics, lesson 8: draw your first class diagram. Four concepts walk through turning code into a diagram step
 * by step (classes, members, is-a lines, has-a lines); then the learner draws one and the app checks it.
 */
import type { UmlLesson } from "../../guides/types";
import classesPy from "./code/draw-first-classes.py?raw";
import classesScala from "./code/draw-first-classes.scala?raw";
import membersPy from "./code/draw-first-members.py?raw";
import membersScala from "./code/draw-first-members.scala?raw";
import inheritPy from "./code/draw-first-inherit.py?raw";
import inheritScala from "./code/draw-first-inherit.scala?raw";
import hasaPy from "./code/draw-first-hasa.py?raw";
import hasaScala from "./code/draw-first-hasa.scala?raw";
import libraryPy from "./code/draw-first-library.py?raw";
import libraryScala from "./code/draw-first-library.scala?raw";

const lesson: UmlLesson = {
  id: "draw-first",
  order: 8,
  title: "Draw your first diagram",
  lede:
    "You know the symbols; now put them together. Turning code into a class diagram is a short routine: find the classes, fill in their members, draw the **is-a** lines, then the **has-a** lines, picking the right one for each. Follow it once on a small shop, then draw a library system yourself and let the app check your work.",
  concepts: [
    {
      id: "classes",
      name: "1. Find the classes",
      short: "One box per class in the code",
      notation: "▭",
      visual: {
        kind: "class",
        uml: {
          classes: [
            { name: "Customer", kind: "concrete" },
            { name: "LineItem", kind: "concrete" },
            { name: "Order", kind: "concrete" }
          ],
          relations: []
        }
      },
      scene: [
        { say: "Read the code top to bottom and draw one empty box for every `class`. Don't think about lines yet.", show: ["Customer"] },
        { say: "Use the exact class names from the code, so anyone can match a box to its code in one glance.", show: ["LineItem", "Order"] },
        { say: "Leave out helpers that only exist to run the demo, and built-in types like `str` or `list`. They add noise, not meaning.", show: [] }
      ],
      what:
        "Step one is a list of boxes. Each class in the code becomes one box with its name at the top. When you design from a story instead of code, the **nouns** that hold data and do something (customer, order, line item) are your classes.",
      spot:
        "Every `class` (and in Scala, every `trait` and `object`) is a candidate. Plain values like `name: str` or `price: float` are not boxes; they become attributes in the next step.",
      when:
        "Always start here. Drawing lines before all the boxes are on the page leads to crossed lines and missed classes. If there are more than about 8 classes, draw only the ones that matter for the question you are answering.",
      code: { python: classesPy, scala: classesScala },
      hl: { python: [5, 9, 13], scala: [4, 6, 8] }
    },
    {
      id: "members",
      name: "2. Add members",
      short: "Attributes and operations, with visibility",
      notation: "+ - ()",
      visual: {
        kind: "class",
        uml: {
          classes: [
            { name: "Customer", kind: "concrete", members: ["+ name: str", "+ email: str"] },
            { name: "LineItem", kind: "concrete", members: ["+ product: str", "+ price: float", "+ qty: int", "+ subtotal(): float"] },
            { name: "Order", kind: "concrete", members: ["+ code: str", "- paid: bool", "+ pay()"] }
          ],
          relations: []
        }
      },
      scene: [
        { say: "Fill the middle part of each box with its **attributes**: the fields, with their types.", show: ["Customer"] },
        { say: "Then the bottom part with its **operations**: the methods. Brackets tell the reader it is something you call.", show: ["LineItem"] },
        { say: "Mark each member public `+` or private `-`. The private `paid` flag tells readers: don't touch this from outside, call `pay()` instead.", show: ["Order"] }
      ],
      what:
        "Step two fills each box: attributes in the middle (`name: type`), operations at the bottom (`name(): return type`). A `+` means public, a `-` means private. You don't need every member; show the ones that explain what the class is for.",
      spot:
        "Python: `self.x = …` in `__init__` is an attribute; a leading `_` means private. Scala: `val` / `var` in the constructor or body is an attribute; `private` means `-`. Every `def` is an operation.",
      when:
        "Add members when the diagram is used to agree on a design or to review it. For a quick big-picture sketch, empty boxes with lines are often enough.",
      code: { python: membersPy, scala: membersScala },
      hl: { python: [3, 4, 13, 20, 22], scala: [1, 4, 7, 9] }
    },
    {
      id: "is-a",
      name: "3. Add is-a lines",
      short: "Inheritance and realization",
      notation: "▷",
      visual: {
        kind: "class",
        uml: {
          classes: [
            { name: "Customer", kind: "concrete", members: ["+ name: str", "+ discount(): float"] },
            { name: "VipCustomer", kind: "concrete", members: ["+ discount(): float"] },
            { name: "Notifier", kind: "interface", members: ["+ send(text)"] },
            { name: "EmailNotifier", kind: "concrete", members: ["+ send(text)"] }
          ],
          relations: [
            { from: "VipCustomer", to: "Customer", type: "inheritance" },
            { from: "EmailNotifier", to: "Notifier", type: "realization" }
          ]
        }
      },
      scene: [
        { say: "Look at what each class extends. `VipCustomer` extends a real class, so it **is a** Customer: a solid line with a hollow triangle at the parent.", show: ["Customer", "VipCustomer", "VipCustomer>Customer"] },
        { say: "`Notifier` has only abstract methods, so it is an **interface**. Mark it with «interface» above its name.", show: ["Notifier"] },
        { say: "A class that fills in an interface **realizes** it: the same hollow triangle, but on a dashed line. It promises to do the job, not to be the same thing.", show: ["EmailNotifier", "EmailNotifier>Notifier"] }
      ],
      what:
        "Step three draws the family tree. **Inheritance** (solid line, hollow triangle at the parent): a child class extends a parent class. **Realization** (dashed line, hollow triangle): a class implements an interface. The triangle always points at the more general type.",
      spot:
        "Python: `class B(A)`; if `A` is an `ABC` with only abstract methods (or a `Protocol`), it's realization, otherwise inheritance. Scala: `extends` / `with` a `trait` with no bodies is realization; extending a class is inheritance.",
      when:
        "Draw these before the has-a lines: they are the easiest to find and they decide where boxes sit (parents above children). Put interfaces at the top so the triangles point up.",
      code: { python: inheritPy, scala: inheritScala },
      hl: { python: [12, 17, 22], scala: [4, 7, 10] }
    },
    {
      id: "has-a",
      name: "4. Add has-a lines",
      short: "Pick dependency, association, aggregation or composition",
      notation: "◆ ◇",
      visual: {
        kind: "class",
        uml: {
          classes: [
            { name: "Order", kind: "concrete", members: ["+ customer: Customer", "+ items: list", "+ receipt: Receipt", "+ add(item)", "+ place(notifier)"] },
            { name: "Customer", kind: "concrete", members: ["+ name: str"] },
            { name: "LineItem", kind: "concrete", members: ["+ product: str", "+ price: float"] },
            { name: "Receipt", kind: "concrete", members: ["+ total: float"] },
            { name: "Notifier", kind: "interface", members: ["+ send(text)"] }
          ],
          relations: [
            { from: "Order", to: "Customer", type: "association" },
            { from: "Order", to: "LineItem", type: "aggregation" },
            { from: "Order", to: "Receipt", type: "composition" },
            { from: "Order", to: "Notifier", type: "dependency" }
          ]
        }
      },
      scene: [
        { say: "Now every field or parameter whose type is one of your classes needs a line. `customer` is passed in and kept, so it is an **association**: a solid line with an open arrow.", show: ["Order", "Customer", "Order>Customer"] },
        { say: "`items` is a collection of line items made somewhere else and added later: **aggregation**, a hollow diamond at the whole.", show: ["LineItem", "Order>LineItem"] },
        { say: "The receipt is created inside `Order` and lives and dies with it: **composition**, a filled diamond.", show: ["Receipt", "Order>Receipt"] },
        { say: "`Notifier` is only a parameter of `place()`, never stored: a **dependency**, the dashed line. When in doubt, pick the loosest line the code supports.", show: ["Notifier", "Order>Notifier"] }
      ],
      what:
        "Step four links classes that use or own each other. Ask one question per link: is it only a parameter (**dependency**), a kept reference that was passed in (**association**), a collection of parts made elsewhere (**aggregation**), or a part the class creates and owns (**composition**)?",
      spot:
        "Parameter only: dependency. `self.x = x` from the constructor: association. `self.xs: list[X] = []` filled from outside: aggregation. `self.x = X(...)` created inside: composition. The diamond sits at the owner (the whole).",
      when:
        "Draw one line per pair of classes, the strongest one the code shows. Skip lines to built-in types. If two classes both point at each other, ask whether one of the links can go; two-way links make code hard to change.",
      code: { python: hasaPy, scala: hasaScala },
      hl: { python: [27, 28, 29, 35], scala: [12, 13, 14, 20] }
    }
  ],
  draw: {
    task:
      "Here is a small library system. Read the code and draw its class diagram: every class, its kind (interface or class), and one line for each pair of classes that is linked. Then press **Check my diagram**.",
    code: { python: libraryPy, scala: libraryScala },
    tips: [
      "Start with the boxes: there are **6 classes**. Mark the one with only abstract methods as an «interface».",
      "Find the **is-a** line first: which class fills in the interface?",
      "For each field of `Loan`, ask: passed in (association), a list filled from outside (aggregation) or created inside (composition)?",
      "A class that only appears as a **parameter** gets a dashed dependency line, not a solid one.",
      "Diamonds and solid lines start at the owner (`Loan`); triangles point at the parent or interface."
    ]
  },
  practiceTitle: "Practice: code to diagram",
  practice: [
    {
      type: "order",
      tag: "Put in order",
      prompt: "Put the steps for turning code into a class diagram in a good order.",
      steps: [
        "Draw one box per class, with its exact name",
        "Fill in attributes and operations with + and -",
        "Draw inheritance and realization lines",
        "Draw has-a lines and pick the right kind for each",
        "Check every line against the code once more"
      ],
      shuffled: [3, 0, 4, 2, 1],
      hint: "Boxes before members, members before lines, and the easy lines before the tricky ones.",
      explain:
        "Boxes first, so lines have somewhere to go. Members next, because the fields tell you which has-a lines exist. Is-a lines are easy to find (extends) and fix where boxes sit. Has-a lines need a decision each. A final check catches lines that don't match the code."
    },
    {
      type: "mcq",
      tag: "Read the diagram",
      code: { lang: "python", text: "class Cart:\n    def __init__(self, owner: User):\n        self.owner = owner" },
      prompt: "Which line goes between Cart and User?",
      options: ["Association: solid line, open arrow", "Composition: filled diamond at Cart", "Dependency: dashed line", "Inheritance: hollow triangle"],
      answer: 0,
      hint: "Where does the User come from, and is it kept?",
      explain:
        "The User is passed in and kept in a field, which is an association. Composition would need Cart to create the User itself. A dependency is only a parameter that is not stored. Inheritance would need class Cart(User)."
    },
    {
      type: "mcq",
      tag: "Read the diagram",
      code: { lang: "scala", text: "class Car:\n  val engine = Engine(150)\n\nclass Engine(val power: Int)" },
      prompt: "Which line goes between Car and Engine?",
      options: ["Association", "Aggregation (hollow diamond)", "Composition (filled diamond at Car)", "Dependency"],
      answer: 2,
      hint: "Who creates the Engine?",
      explain:
        "Car creates its own Engine and nobody else holds it, so the engine lives and dies with the car: composition. Association and aggregation would need the engine to be passed in from outside. A dependency would mean Engine is only a parameter."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "A Python class Speaker(ABC) has only abstract methods. class Phone(Speaker) fills them in. What do you draw?",
      options: [
        "Phone to Speaker, dashed line with hollow triangle (realization)",
        "Phone to Speaker, solid line with hollow triangle (inheritance)",
        "Speaker to Phone, filled diamond (composition)",
        "No line, because Python has no interfaces"
      ],
      answer: 0,
      hint: "An ABC with only abstract methods plays the role of an interface.",
      explain:
        "An ABC with only abstract methods is an interface in UML, and a class that fills one in realizes it: dashed line, hollow triangle at Speaker. Inheritance is for extending a real class. Nothing is owned here, so no diamond. Python has no interface keyword, but the idea still applies."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "The diagram shows a filled diamond (composition) from Team to Player. Which line of the code shows that the diagram is wrong?",
      code: {
        lang: "python",
        text:
          "class Player:\n    def __init__(self, name: str):\n        self.name = name\n\nclass Team:\n    def __init__(self, players: list[Player]):\n        self.players = players\n\nteam = Team([Player(\"Asha\"), Player(\"Ravi\")])\nprint(len(team.players))"
      },
      answer: 7,
      hint: "Composition means the whole creates its parts. Where are the players created?",
      explain:
        "Line 7 stores a list that was passed in; the players are created outside Team, on line 9, so they can live on without it. That is aggregation (hollow diamond), not composition. The other lines define the classes or run the demo and don't decide the kind of link."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "Which of these should NOT get its own box in a class diagram drawn from code?",
      options: ["A class Invoice", "A trait Payment", "A field name: str", "An object Config (Scala singleton)"],
      answer: 2,
      hint: "Boxes are for types you defined.",
      explain:
        "name: str is a plain value, so it goes inside the box as an attribute. Invoice is a class, Payment is an interface, and Config is a singleton object; all three are types in your code and each gets a box."
    }
  ]
};

export default lesson;
