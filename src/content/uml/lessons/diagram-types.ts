/**
 * UML Basics, lesson 1: the 14 diagram types, and the five that matter in Low-Level Design.
 * Each concept's visual is a tiny example of that diagram. Every code file runs as-is.
 */
import type { UmlLesson } from "../../guides/types";
import classPy from "./code/diagram-types-class.py?raw";
import classScala from "./code/diagram-types-class.scala?raw";
import seqPy from "./code/diagram-types-sequence.py?raw";
import seqScala from "./code/diagram-types-sequence.scala?raw";
import statePy from "./code/diagram-types-state.py?raw";
import stateScala from "./code/diagram-types-state.scala?raw";
import actPy from "./code/diagram-types-activity.py?raw";
import actScala from "./code/diagram-types-activity.scala?raw";
import ucPy from "./code/diagram-types-usecase.py?raw";
import ucScala from "./code/diagram-types-usecase.scala?raw";
import othersPy from "./code/diagram-types-others.py?raw";
import othersScala from "./code/diagram-types-others.scala?raw";

const lesson: UmlLesson = {
  id: "diagram-types",
  order: 1,
  title: "The 14 diagram types",
  lede:
    "UML (Unified Modeling Language) is a set of standard pictures for software. It has 14 diagram types in two families: " +
    "**structure** diagrams show what the parts are, and **behaviour** diagrams show what they do over time. " +
    "In Low-Level Design you will draw five of them again and again. This lesson shows a tiny example of each, and the code it stands for.",
  concepts: [
    {
      id: "class",
      name: "Class diagram",
      short: "Structure: classes and how they connect",
      notation: "▭",
      visual: {
        kind: "class",
        uml: {
          classes: [
            { name: "Order", kind: "concrete", members: ["- id: str", "- customer: Customer", "+ total(): float"] },
            { name: "Customer", kind: "concrete", members: ["- name: str"] }
          ],
          relations: [{ from: "Order", to: "Customer", type: "association" }]
        }
      },
      scene: [
        { say: "A class diagram starts with boxes. Each box is one class, with its data and its methods listed inside.", show: ["Order"] },
        { say: "Then come the lines. This one says an Order keeps a Customer as a field, so it can reach it at any time.", show: ["Customer", "Order>Customer"] }
      ],
      what:
        "A **structure** diagram: the classes in your design, what each one holds, what it can do, and how the classes are connected. " +
        "It is a map of the code that does not change while the program runs.",
      spot: "Every `class` (or `trait`) becomes a box. Fields and methods become the lines inside it. A field whose type is another class becomes a line between two boxes.",
      when:
        "Almost always. It is the main diagram of every LLD interview and design review: draw it first, then use the others to explain the tricky parts.",
      code: { python: classPy, scala: classScala },
      hl: { python: [1, 6, 9, 11], scala: [1, 3, 4] }
    },
    {
      id: "sequence",
      name: "Sequence diagram",
      short: "Behaviour: who calls whom, in what order",
      notation: "→ ⇠",
      visual: {
        kind: "sequence",
        spec: {
          participants: [
            { id: "shop", name: "checkout", kind: "client" },
            { id: "cart", name: "Cart", kind: "concrete" },
            { id: "pay", name: "Payment", kind: "concrete" }
          ],
          messages: [
            { from: "shop", to: "cart", label: "total()" },
            { from: "cart", to: "shop", label: "499", kind: "return" },
            { from: "shop", to: "pay", label: "charge(499)" },
            { from: "pay", to: "shop", label: "\"paid 499\"", kind: "return" }
          ],
          label: "Sequence diagram: checkout asks the Cart for its total, then asks Payment to charge it."
        }
      },
      scene: [
        { say: "Each object gets a lifeline: a box at the top with a dashed line going down. Time flows downwards.", show: ["shop", "cart", "pay"] },
        { say: "A solid arrow is a call, and the dashed arrow is the answer coming back. First checkout asks the cart for its total.", show: ["m1", "m2"] },
        { say: "Only then does it charge the payment. The order of arrows from top to bottom is the order of calls in the code.", show: ["m3", "m4"] }
      ],
      what:
        "A **behaviour** diagram that shows one scenario as a list of calls between objects, from top to bottom. " +
        "It answers \"what happens, step by step, when the user clicks Checkout?\".",
      spot: "Read one method from top to bottom. Every call on another object (`cart.total()`) is a solid arrow; every value it returns is a dashed arrow back.",
      when:
        "When the order of calls matters, or when several objects work together on one request. Interviewers often ask for one key flow as a sequence diagram.",
      code: { python: seqPy, scala: seqScala },
      hl: { python: [12, 13], scala: [8, 9] }
    },
    {
      id: "state",
      name: "State machine diagram",
      short: "Behaviour: the states one object moves through",
      notation: "( ) →",
      visual: {
        kind: "flow",
        spec: {
          width: 360,
          height: 360,
          label: "State machine of an order: Placed, then Shipped, then Delivered; a placed order can also be cancelled.",
          nodes: [
            { id: "start", kind: "initial", x: 60, y: 10 },
            { id: "placed", kind: "state", label: "Placed", x: 0, y: 60 },
            { id: "shipped", kind: "state", label: "Shipped", x: 0, y: 150 },
            { id: "delivered", kind: "state", label: "Delivered", x: 0, y: 240 },
            { id: "end", kind: "final", x: 58, y: 320 },
            { id: "cancelled", kind: "state", label: "Cancelled", x: 200, y: 150 }
          ],
          edges: [
            { id: "t0", from: "start", to: "placed" },
            { id: "t1", from: "placed", to: "shipped", label: "ship" },
            { id: "t2", from: "shipped", to: "delivered", label: "deliver" },
            { id: "t3", from: "delivered", to: "end" },
            { id: "t4", from: "placed", to: "cancelled", label: "cancel", via: [[270, 82]], labelAt: [180, 74] }
          ]
        }
      },
      scene: [
        { say: "The filled dot is where every order starts. A rounded box is a state: a situation the order can be in.", show: ["start", "t0", "placed"] },
        { say: "Arrows are transitions, labelled with the event that causes them. Ship moves the order on, deliver finishes it.", show: ["shipped", "t1", "delivered", "t2", "end", "t3"] },
        { say: "There is no arrow from Shipped to Cancelled, so a shipped order can't be cancelled. The missing arrows are rules too.", show: ["cancelled", "t4"] }
      ],
      what:
        "A **behaviour** diagram for one object: every state it can be in, and which events move it from one state to the next. " +
        "Anything not drawn is not allowed.",
      spot: "An `Enum` or `status` field, plus code that checks the current status before changing it. Each allowed change is one arrow.",
      when:
        "When an object has a life cycle with rules: orders, tickets, elevators, vending machines, payments. It is also the first step towards the State pattern.",
      code: { python: statePy, scala: stateScala },
      hl: { python: [13, 14, 15], scala: [6, 7, 8] }
    },
    {
      id: "activity",
      name: "Activity diagram",
      short: "Behaviour: the steps of a workflow",
      notation: "◇",
      visual: {
        kind: "flow",
        spec: {
          width: 360,
          height: 350,
          label: "Activity diagram of checkout: check stock; if in stock take payment and ship, otherwise tell the customer.",
          nodes: [
            { id: "start", kind: "initial", x: 65, y: 10 },
            { id: "check", kind: "action", label: "Check stock", x: 0, y: 54 },
            { id: "dec", kind: "decision", x: 57, y: 120 },
            { id: "pay", kind: "action", label: "Take payment", x: 0, y: 186 },
            { id: "ship", kind: "action", label: "Ship order", x: 0, y: 250 },
            { id: "tell", kind: "action", label: "Tell customer", x: 200, y: 186 },
            { id: "end", kind: "final", x: 63, y: 316 }
          ],
          edges: [
            { id: "a0", from: "start", to: "check" },
            { id: "a1", from: "check", to: "dec" },
            { id: "a2", from: "dec", to: "pay", label: "[in stock]" },
            { id: "a3", from: "pay", to: "ship" },
            { id: "a4", from: "ship", to: "end" },
            { id: "a5", from: "dec", to: "tell", label: "[no stock]", via: [[275, 138]], labelAt: [130, 130] },
            { id: "a6", from: "tell", to: "end", via: [[275, 328]] }
          ]
        }
      },
      scene: [
        { say: "An activity diagram reads like a flowchart. It starts at the dot and each pill-shaped box is one step of work.", show: ["start", "a0", "check"] },
        { say: "The diamond is a decision. Each way out has a guard in square brackets, and exactly one of them is true.", show: ["a1", "dec"] },
        { say: "In stock: take payment, then ship. Both paths end at the same final dot, just as the code returns in both branches.", show: ["a2", "pay", "a3", "ship", "a4", "end", "a5", "tell", "a6"] }
      ],
      what:
        "A **behaviour** diagram of a process: the steps, the decisions between them and the end. " +
        "Unlike a state machine, the boxes are things being **done**, not situations something is **in**.",
      spot: "A method or a business process with several steps and `if` / `else` branches. Each `if` is a diamond; each block of work is a pill.",
      when:
        "To agree on a workflow before coding it (checkout, refund, sign-up), or to explain a long method to someone who doesn't read code.",
      code: { python: actPy, scala: actScala },
      hl: { python: [3, 6], scala: [3, 5] }
    },
    {
      id: "usecase",
      name: "Use case diagram",
      short: "Behaviour: who uses the system for what",
      notation: "웃 ⬭",
      visual: {
        kind: "flow",
        spec: {
          width: 360,
          height: 300,
          label: "Use case diagram: a Customer can browse items and place an order in the online shop; placing an order includes paying.",
          nodes: [
            { id: "shop", kind: "boundary", label: "Online shop", x: 90, y: 0, w: 270, h: 300 },
            { id: "customer", kind: "actor", label: "Customer", x: 14, y: 100 },
            { id: "browse", kind: "usecase", label: "Browse items", x: 160, y: 40 },
            { id: "order", kind: "usecase", label: "Place order", x: 160, y: 130 },
            { id: "pay", kind: "usecase", label: "Pay", x: 160, y: 230 }
          ],
          edges: [
            { id: "u1", from: "customer", to: "browse", arrow: "none" },
            { id: "u2", from: "customer", to: "order", arrow: "none" },
            { id: "u3", from: "order", to: "pay", label: "«include»", dashed: true }
          ]
        }
      },
      scene: [
        { say: "The stick figure is an actor: a person or another system outside ours. The big box is the system itself.", show: ["customer", "shop"] },
        { say: "Each oval is a use case: one goal the actor can reach with the system. A plain line means this actor can do it.", show: ["browse", "u1", "order", "u2"] },
        { say: "Placing an order always includes paying, so a dashed «include» arrow points to Pay. It is a step, not a separate goal.", show: ["pay", "u3"] }
      ],
      what:
        "A **behaviour** diagram at the highest level: who the users are and what goals they have. " +
        "It says nothing about classes or order of steps; it is the list of features as a picture.",
      spot: "The public methods of a service or the buttons of an app. Each one a user calls directly is a use case; private helpers that always run are «include».",
      when:
        "At the very start of an interview or project, to agree on scope: which actors, which features, and what is out of the box.",
      code: { python: ucPy, scala: ucScala },
      hl: { python: [4, 7, 8], scala: [3, 4] }
    },
    {
      id: "others",
      name: "The other nine",
      short: "Object, package, component, deployment and more",
      notation: "14",
      visual: {
        kind: "flow",
        spec: {
          width: 360,
          height: 320,
          label: "The UML family: 7 structure diagrams and 7 behaviour diagrams; the five used most in LLD are starred.",
          nodes: [
            { id: "uml", kind: "state", label: "UML: 14 diagrams", x: 90, y: 0, w: 180, h: 44 },
            { id: "structure", kind: "note", label: "Structure (7)\nClass ★\nObject\nPackage\nComponent\nComposite structure\nDeployment\nProfile", x: 0, y: 90, w: 168, h: 150 },
            { id: "behaviour", kind: "note", label: "Behaviour (7)\nUse case ★\nActivity ★\nState machine ★\nSequence ★\nCommunication\nTiming\nInteraction overview", x: 192, y: 90, w: 168, h: 150 },
            { id: "key", kind: "note", label: "★ = the five you draw in LLD", x: 50, y: 270, w: 260, h: 40 }
          ],
          edges: [
            { id: "f1", from: "uml", to: "structure", arrow: "none" },
            { id: "f2", from: "uml", to: "behaviour", arrow: "none" }
          ]
        }
      },
      scene: [
        { say: "UML 2.5 has 14 diagram types. They split into two families of seven.", show: ["uml"] },
        { say: "Structure diagrams show the parts and how they fit: classes, objects, packages, components and servers.", show: ["structure", "f1"] },
        { say: "Behaviour diagrams show what happens over time. Sequence, communication, timing and interaction overview all show calls between objects.", show: ["behaviour", "f2"] },
        { say: "Only five are everyday tools in LLD. Learn to read the other nine, but don't reach for them first.", show: ["key"] }
      ],
      what:
        "The nine you will meet less often. **Object**: a snapshot of real objects and their values. **Package**: folders of classes. " +
        "**Component** and **Deployment**: bigger building blocks and the servers they run on (more HLD than LLD). " +
        "**Composite structure** and **Profile**: the inside of one class, and extensions to UML itself. " +
        "**Communication**, **Timing** and **Interaction overview**: other ways to draw calls over time.",
      spot: "Folders and modules (packages), services and their APIs (components), servers and containers (deployment). A debugger's view of objects is an object diagram.",
      when:
        "Object diagrams help when a class diagram is too abstract (\"show me one real example\"). Package and deployment diagrams belong to system design. The rest are rare in interviews.",
      code: { python: othersPy, scala: othersScala },
      hl: { python: [1, 3, 5], scala: [1, 3, 5] }
    }
  ],
  practiceTitle: "Which diagram?",
  practice: [
    {
      type: "mcq",
      tag: "Concept",
      prompt: "UML diagrams come in two families. Which pair is right?",
      options: ["Structure and behaviour", "Static and dynamic only for classes", "Design and test", "Logical and physical"],
      answer: 0,
      hint: "One family shows what the parts are; the other shows what they do.",
      explain:
        "UML splits its 14 diagrams into **structure** (class, object, package, component…) and **behaviour** (use case, activity, state machine, sequence…). " +
        "The other pairs are real words in software, but they are not how UML groups its diagrams."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "An interviewer asks: \"A ticket can be Open, In progress or Closed, and only an Open ticket can be assigned.\" Which diagram shows these rules best?",
      options: ["Class diagram", "State machine diagram", "Use case diagram", "Sequence diagram"],
      answer: 1,
      hint: "The question is about one object and the situations it can be in.",
      explain:
        "A **state machine** draws each state as a box and each allowed change as an arrow, so \"only Open can be assigned\" is simply an arrow that exists only from Open. " +
        "A class diagram shows fields, not rules over time; a use case diagram shows goals; a sequence diagram shows calls between objects."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "You want to show what happens, call by call, when a user taps \"Book ride\": the app calls the RideService, which calls the DriverFinder, which returns a driver. Which diagram?",
      options: ["Activity diagram", "Use case diagram", "Sequence diagram", "Package diagram"],
      answer: 2,
      hint: "Several objects, and the order of calls between them matters.",
      explain:
        "A **sequence diagram** has a lifeline per object and an arrow per call, from top to bottom in time order. " +
        "An activity diagram shows steps but not **who** does each call; a use case diagram only says \"Book ride\" exists; a package diagram shows folders."
    },
    {
      type: "mcq",
      tag: "Read the code",
      prompt: "Which diagram would you draw to show this code's structure: its classes, fields and the link between them?",
      code: {
        lang: "scala",
        text: "class Driver(val name: String)\n\nclass Ride(val id: String, val driver: Driver):\n  def fare(): Double = 120.0\n\n@main def demo(): Unit = println(Ride(\"R1\", Driver(\"Ravi\")).fare())"
      },
      options: ["Class diagram", "Activity diagram", "Timing diagram"],
      answer: 0,
      hint: "The question asks about structure, not about steps or time.",
      explain:
        "A **class diagram** draws `Ride` and `Driver` as boxes with their fields and `fare()`, and a line from Ride to Driver because Ride keeps a Driver field. " +
        "An activity diagram would show steps of a process, and a timing diagram shows values changing over exact time; neither shows classes."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "Which of these is a **structure** diagram?",
      options: ["Sequence diagram", "Deployment diagram", "State machine diagram", "Activity diagram"],
      answer: 1,
      hint: "Structure diagrams show things that exist, not things that happen.",
      explain:
        "A **deployment** diagram shows servers and what runs on them: a structure that doesn't change while the program runs. " +
        "Sequence, state machine and activity diagrams all describe behaviour over time."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "This is meant to be the code behind a state machine where a Delivered order is final. Which line breaks the diagram's rule?",
      code: {
        lang: "python",
        text:
          "MOVES = {\n    (\"Placed\", \"ship\"): \"Shipped\",\n    (\"Placed\", \"cancel\"): \"Cancelled\",\n    (\"Shipped\", \"deliver\"): \"Delivered\",\n    (\"Delivered\", \"cancel\"): \"Cancelled\",\n}\nprint(MOVES[(\"Placed\", \"ship\")])"
      },
      answer: 5,
      hint: "Look for an arrow that leaves the state the diagram says is final.",
      explain:
        "Line 5 adds an arrow out of **Delivered**, so a delivered order could be cancelled. In the diagram, Delivered only leads to the final dot. " +
        "The other lines match arrows that the diagram does draw: Placed → Shipped, Placed → Cancelled and Shipped → Delivered."
    },
    {
      type: "order",
      tag: "Put in order",
      prompt: "A sensible order for diagrams in an LLD interview, from first to last:",
      steps: [
        "Use case diagram: agree on actors and features",
        "Class diagram: the classes and how they connect",
        "Sequence diagram: walk one key flow through those classes",
        "State machine: rules for the one object with a life cycle"
      ],
      shuffled: [2, 0, 3, 1],
      hint: "Start wide (what the system does), then the parts, then how the parts behave.",
      explain:
        "First agree on **scope** (use cases), then design the **structure** (class diagram), then prove it works by walking a **flow** through it (sequence), " +
        "and finally pin down the tricky **life cycle** rules (state machine). Drawing a sequence before the classes exist leaves you with nothing to call."
    }
  ]
};

export default lesson;
