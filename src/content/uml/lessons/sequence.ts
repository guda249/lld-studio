/**
 * UML Basics, lesson 5: sequence diagrams. Every code example runs as-is.
 */
import type { UmlLesson } from "../../guides/types";
import lifelinesPy from "./code/sequence-lifelines.py?raw";
import lifelinesScala from "./code/sequence-lifelines.scala?raw";
import callPy from "./code/sequence-call.py?raw";
import callScala from "./code/sequence-call.scala?raw";
import returnPy from "./code/sequence-return.py?raw";
import returnScala from "./code/sequence-return.scala?raw";
import createPy from "./code/sequence-create.py?raw";
import createScala from "./code/sequence-create.scala?raw";
import selfPy from "./code/sequence-self.py?raw";
import selfScala from "./code/sequence-self.scala?raw";
import toCodePy from "./code/sequence-tocode.py?raw";
import toCodeScala from "./code/sequence-tocode.scala?raw";
import altLoopPy from "./code/sequence-altloop.py?raw";
import altLoopScala from "./code/sequence-altloop.scala?raw";

const lesson: UmlLesson = {
  id: "sequence",
  order: 5,
  title: "Sequence diagrams",
  lede:
    "A class diagram shows who **knows** whom. A sequence diagram shows who **calls** whom, and in what order, for one " +
    "scenario. Time runs from top to bottom. Read it like a story: each arrow is one method call, and the story ends " +
    "when the last answer comes back.",
  concepts: [
    {
      id: "lifelines",
      name: "Participants and lifelines",
      short: "One box per object, time runs down",
      notation: "a:A",
      visual: {
        kind: "sequence",
        spec: {
          label: "A guest asks the waiter for a dosa; the waiter asks the kitchen to cook it, and the answer comes back up.",
          participants: [
            { id: "guest", name: "Guest", kind: "client" },
            { id: "waiter", name: "waiter: Waiter", kind: "concrete" },
            { id: "kitchen", name: "kitchen: Kitchen", kind: "concrete" }
          ],
          messages: [
            { from: "guest", to: "waiter", label: "take_order(\"Dosa\")" },
            { from: "waiter", to: "kitchen", label: "cook(\"Dosa\")" },
            { from: "kitchen", to: "waiter", label: "\"Dosa is ready\"", kind: "return" },
            { from: "waiter", to: "guest", label: "\"Dosa is ready\"", kind: "return" }
          ]
        }
      },
      scene: [
        { say: "Each box at the top is one **object** taking part in the story, written as `name: Class`. The guest is the code that starts it all.", show: ["guest", "waiter", "kitchen"] },
        { say: "The dashed line under each box is its **lifeline**: the object's life, with time running downwards.", show: ["m1"] },
        { say: "Arrows go between lifelines. Lower arrows happen later, so you read the scenario from top to bottom.", show: ["m2", "m3", "m4"] }
      ],
      what:
        "A participant is one object (or the outside caller) that takes part in a scenario. Its lifeline is the dashed line below it, " +
        "showing the object over time. The box says `name: Class`, so `waiter: Waiter` means \"an object called waiter, of class Waiter\".",
      spot:
        "Every object that receives a method call in the scenario is a participant. Look for the variables that hold objects: `kitchen = Kitchen()`, `waiter = Waiter(kitchen)`.",
      when:
        "Draw a sequence diagram when the order of calls matters: a checkout flow, a login, a request passing through layers. Pick one scenario per diagram; do not try to show every path.",
      code: { python: lifelinesPy, scala: lifelinesScala },
      hl: { python: [15, 16], scala: [9, 10] }
    },
    {
      id: "call",
      name: "Synchronous call",
      short: "Solid line, filled arrowhead",
      notation: "──▶",
      visual: {
        kind: "sequence",
        spec: {
          label: "Checkout calls charge(499) on the payment gateway and waits until it answers PAID.",
          participants: [
            { id: "client", name: "Client", kind: "client" },
            { id: "checkout", name: "checkout: Checkout", kind: "concrete" },
            { id: "gateway", name: "gateway: PaymentGateway", kind: "concrete" }
          ],
          messages: [
            { from: "client", to: "checkout", label: "pay(499)" },
            { from: "checkout", to: "gateway", label: "charge(499)" },
            { from: "gateway", to: "checkout", label: "\"PAID\"", kind: "return" }
          ]
        }
      },
      scene: [
        { say: "A solid line with a filled arrowhead is a **synchronous call**: the caller asks and then waits.", show: ["client", "checkout", "gateway", "m1"] },
        { say: "Checkout calls `charge(499)`. Nothing else happens in checkout until the gateway is done.", show: ["m2"] },
        { say: "Only when the answer comes back does checkout carry on. That waiting is what \"synchronous\" means.", show: ["m3"] }
      ],
      what:
        "A synchronous call is an ordinary method call. The caller sends the message, stops, and continues only after the callee returns. " +
        "The label is the method name with its arguments, like `charge(499)`.",
      spot:
        "Any normal call on another object: `self.gateway.charge(amount)` in Python, `gateway.charge(amount)` in Scala. The next line of the caller runs only after it returns.",
      when:
        "Almost every arrow you draw in LLD is synchronous. Use another arrow style (open arrowhead, asynchronous) only for messages sent to a queue or a thread that the caller does not wait for.",
      code: { python: callPy, scala: callScala },
      hl: { python: [13], scala: [9] }
    },
    {
      id: "return",
      name: "Return message",
      short: "Dashed line back to the caller",
      notation: "◀--",
      visual: {
        kind: "sequence",
        spec: {
          label: "The cart asks the inventory whether a pen is in stock and gets true back.",
          participants: [
            { id: "client", name: "Client", kind: "client" },
            { id: "cart", name: "cart: Cart", kind: "concrete" },
            { id: "inventory", name: "inventory: Inventory", kind: "concrete" }
          ],
          messages: [
            { from: "client", to: "cart", label: "add(\"pen\")" },
            { from: "cart", to: "inventory", label: "in_stock(\"pen\")" },
            { from: "inventory", to: "cart", label: "True", kind: "return" },
            { from: "cart", to: "client", label: "\"pen: added\"", kind: "return" }
          ]
        }
      },
      scene: [
        { say: "The cart asks the inventory a question with a call.", show: ["client", "cart", "inventory", "m1", "m2"] },
        { say: "The **dashed** arrow going back is the return. Its label is the value that comes back: here `True`.", show: ["m3"] },
        { say: "The cart uses that value and returns its own answer to the client. Each call is closed by its own return.", show: ["m4"] }
      ],
      what:
        "A return message is the answer to a call, drawn as a dashed line with an open arrowhead back to the caller. Its label is the returned value or the variable that holds it.",
      spot:
        "A `return` statement in the callee (or the last expression of a Scala method), and the variable on the caller's side that receives it: `ok = self.inventory.in_stock(sku)`.",
      when:
        "Draw a return when the value matters to the story (a status, a receipt, true or false). You may leave out returns of `None` / `Unit` to keep the diagram short.",
      code: { python: returnPy, scala: returnScala },
      hl: { python: [6, 14], scala: [4, 8] }
    },
    {
      id: "create",
      name: "Object creation",
      short: "«create» starts a new lifeline",
      notation: "new",
      visual: {
        kind: "sequence",
        spec: {
          label: "The order service creates a new order, then adds an item to it, then returns it.",
          participants: [
            { id: "client", name: "Client", kind: "client" },
            { id: "service", name: "service: OrderService", kind: "concrete" },
            { id: "order", name: "order: Order", kind: "concrete" }
          ],
          messages: [
            { from: "client", to: "service", label: "place(\"Asha\", item)" },
            { from: "service", to: "order", label: "Order(\"Asha\")", kind: "create" },
            { from: "service", to: "order", label: "add(item)" },
            { from: "service", to: "client", label: "order", kind: "return" }
          ]
        }
      },
      scene: [
        { say: "Before the call, the order does not exist yet. Only the service is waiting for work.", show: ["client", "service", "m1"] },
        { say: "A dashed arrow marked **«create»** is a constructor call. The new object's life starts here.", show: ["order", "m2"] },
        { say: "Once it exists, the order can receive normal calls like `add(item)`, and the service hands it back.", show: ["m3", "m4"] }
      ],
      what:
        "A create message shows one object making another. It is drawn as a dashed arrow labelled «create» pointing at the new object. Strict UML places the new box lower, where it is born; this app keeps the boxes in one row and lets the «create» label mark the moment.",
      spot:
        "A constructor call inside a method: `order = Order(customer)` in Python, `val order = Order(customer)` in Scala (no `new` needed in Scala 3).",
      when:
        "Show creation when who makes the object matters, for example when you discuss factories, or when an object lives only for one request.",
      code: { python: createPy, scala: createScala },
      hl: { python: [12, 13], scala: [9, 10] }
    },
    {
      id: "self-call",
      name: "Self-call",
      short: "An object calls its own method",
      notation: "⟲",
      visual: {
        kind: "sequence",
        spec: {
          label: "A bill computes its total by calling its own subtotal and tax methods.",
          participants: [
            { id: "client", name: "Client", kind: "client" },
            { id: "bill", name: "bill: Bill", kind: "concrete" },
            { id: "console", name: "console", kind: "client" }
          ],
          messages: [
            { from: "client", to: "bill", label: "total()" },
            { from: "bill", to: "bill", label: "subtotal()", kind: "self" },
            { from: "bill", to: "bill", label: "tax(500)", kind: "self" },
            { from: "bill", to: "client", label: "525.0", kind: "return" },
            { from: "client", to: "console", label: "print(525.0)" }
          ]
        }
      },
      scene: [
        { say: "The client asks the bill for its total.", show: ["client", "bill", "console", "m1"] },
        { say: "To answer, the bill calls **its own** methods. A self-call is an arrow that leaves the lifeline and loops back to it.", show: ["m2", "m3"] },
        { say: "Only then does the total travel back to the client, which prints it.", show: ["m4", "m5"] }
      ],
      what:
        "A self-call (also called a self-message) is a call an object makes to one of its own methods. It is drawn as a small loop on the same lifeline.",
      spot:
        "`self.subtotal()` in Python, or a plain `subtotal()` (same as `this.subtotal()`) inside a Scala class.",
      when:
        "Draw a self-call when the helper step is important to understand the flow. Skip tiny helpers, or the diagram fills with loops that hide the real conversation between objects.",
      code: { python: selfPy, scala: selfScala },
      hl: { python: [6, 7], scala: [3, 4] }
    },
    {
      id: "to-code",
      name: "From diagram to code",
      short: "Each arrow is one line of code",
      notation: "1→n",
      visual: {
        kind: "sequence",
        spec: {
          label: "Main calls shop.buy(250); the shop charges the gateway, which creates a receipt; the shop logs it and says thanks.",
          participants: [
            { id: "main", name: "main", kind: "client" },
            { id: "shop", name: "shop: Shop", kind: "concrete" },
            { id: "gateway", name: "gateway: Gateway", kind: "concrete" },
            { id: "receipt", name: "Receipt", kind: "concrete" }
          ],
          messages: [
            { from: "main", to: "shop", label: "buy(250)" },
            { from: "shop", to: "gateway", label: "charge(price)" },
            { from: "gateway", to: "receipt", label: "Receipt(amount)", kind: "create" },
            { from: "gateway", to: "shop", label: "receipt", kind: "return" },
            { from: "shop", to: "shop", label: "log(receipt)", kind: "self" },
            { from: "shop", to: "main", label: "\"thanks\"", kind: "return" }
          ]
        }
      },
      scene: [
        { say: "Arrow 1 is the call in the last line of the program. An arrow **into** a lifeline means \"this method of that class runs\".", show: ["main", "shop", "gateway", "receipt", "m1"] },
        { say: "Arrows 2 and 3 are lines **inside** `buy` and `charge`: the body of a method holds the arrows that leave it.", show: ["m2", "m3"] },
        { say: "Arrow 4 is `charge` returning; arrow 5 is the next line of `buy`, a self-call.", show: ["m4", "m5"] },
        { say: "Arrow 6 is `buy` returning. Going down the diagram is the same as stepping through the code line by line.", show: ["m6"] }
      ],
      what:
        "A sequence diagram is a picture of one run of the code. Each call arrow becomes a method call, the arrows leaving a lifeline after an incoming call are the lines inside that method, and the matching return ends the method.",
      spot:
        "Follow the numbers: the comment on each highlighted line gives the number of the arrow it stands for. The callee of each arrow is the class that must have that method.",
      when:
        "Use it both ways. Before coding, draw the scenario to find which methods each class needs. When reading unfamiliar code, sketch the diagram to see how a request travels.",
      code: { python: toCodePy, scala: toCodeScala },
      hl: { python: [8, 16, 17, 18, 24], scala: [5, 9, 10, 11, 17] }
    },
    {
      id: "alt-loop",
      name: "alt and loop as if / for",
      short: "Guards in [ ] read as if and for",
      notation: "[g]",
      visual: {
        kind: "sequence",
        spec: {
          label: "Checkout reserves every item in a loop, then either charges or cancels depending on whether all were reserved.",
          participants: [
            { id: "client", name: "Client", kind: "client" },
            { id: "checkout", name: "checkout: Checkout", kind: "concrete" },
            { id: "stock", name: "stock: Stock", kind: "concrete" }
          ],
          messages: [
            { from: "client", to: "checkout", label: "run(items)" },
            { from: "checkout", to: "stock", label: "[each item] reserve(item)" },
            { from: "stock", to: "checkout", label: "ok", kind: "return" },
            { from: "checkout", to: "client", label: "[all ok] \"charged\"", kind: "return" },
            { from: "checkout", to: "client", label: "[else] \"cancelled\"", kind: "return" }
          ]
        }
      },
      scene: [
        { say: "Full UML draws a box labelled **loop** around arrows that repeat. Here the guard `[each item]` on the arrow says the same thing: read it as a `for` loop.", show: ["client", "checkout", "stock", "m1", "m2", "m3"] },
        { say: "An **alt** box holds alternatives, each with a guard such as `[all ok]` or `[else]`. Read it as `if` / `else`: only one of these arrows happens in a given run.", show: ["m4", "m5"] }
      ],
      what:
        "Combined fragments are boxes that group arrows. `loop [condition]` repeats the arrows inside; `alt [guard] … [else]` runs exactly one of its sections; `opt [guard]` runs its arrows or skips them. This app's diagrams do not draw the boxes, so the guard is written in square brackets at the start of the message label.",
      spot:
        "A `loop` is a `for` or `while` around calls; an `alt` is an `if` / `elif` / `else` (or a `match`) whose branches make different calls; an `opt` is an `if` with no `else`.",
      when:
        "Add a loop or alt only when the repeat or the choice is the point of the scenario. If the diagram fills with nested fragments, draw two simpler diagrams, one per path, instead.",
      code: { python: altLoopPy, scala: altLoopScala },
      hl: { python: [15, 16, 17, 19], scala: [8, 9, 10, 11] }
    }
  ],
  practiceTitle: "Practice: read the sequence",
  practice: [
    {
      type: "mcq",
      tag: "Concept",
      prompt: "In a sequence diagram, which direction does time run?",
      options: ["Left to right, along the arrows", "Top to bottom, down the lifelines", "Bottom to top, from the last return", "There is no time order; only the numbers matter"],
      answer: 1,
      hint: "Think about where the first call is drawn.",
      explain:
        "Time runs down the lifelines: the first call is at the top and each lower arrow happens later. Arrows point left or right only to show who calls whom, not time. The numbers just repeat the top-to-bottom order."
    },
    {
      type: "mcq",
      tag: "Read the diagram",
      prompt: "An arrow is drawn as a dashed line with an open arrowhead, labelled `receipt`, from Gateway to Shop. What is it?",
      options: ["Shop calls a method named receipt on Gateway", "Gateway creates a Shop", "Gateway returns the value receipt to Shop", "Gateway calls itself"],
      answer: 2,
      hint: "Solid lines are calls. What are dashed lines without «create»?",
      explain:
        "A dashed line with an open arrowhead is a return; the label is the value coming back. A call would be a solid line pointing at the callee. Creation is also dashed but is marked «create». A self-call loops back to the same lifeline."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "Which line of code is drawn as a «create» message?",
      code: { lang: "scala", text: "val order = Order(customer)\norder.add(item)\nprintln(order.items)" },
      options: ["`val order = Order(customer)`", "`order.add(item)`", "`println(order.items)`"],
      answer: 0,
      hint: "Which line makes a new object?",
      explain:
        "`Order(customer)` calls the constructor, so it is the «create» message and the start of the Order's lifeline. `order.add(item)` is a normal synchronous call to an existing object. `println` is a call to the console, not object creation."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "The diagram shows: Client → bill: `total()`, then a self-call `subtotal()` on bill, then bill returns the total. Which line does NOT match the diagram?",
      code: {
        lang: "python",
        text:
          "class Bill:\n    def __init__(self, prices: list[int]):\n        self.prices = prices\n\n    def total(self) -> int:\n        return Calculator().subtotal(self.prices)\n\n    def subtotal(self) -> int:\n        return sum(self.prices)\n\nprint(Bill([1, 2]).total())"
      },
      answer: 6,
      hint: "A self-call stays on the same lifeline.",
      explain:
        "Line 6 asks a different object, a new Calculator, for the subtotal. That would be a «create» and a call to another participant, not a self-call. To match the diagram it should be `return self.subtotal()`. The other lines are the class, its field and the call that starts the scenario."
    },
    {
      type: "order",
      tag: "Put in order",
      prompt: "`shop.buy(250)` runs `receipt = gateway.charge(price)`, then `self.log(receipt)`, then returns. Put the arrows in the order they appear, top to bottom.",
      steps: ["main → shop: buy(250)", "shop → gateway: charge(price)", "gateway → shop: return receipt", "shop → shop: log(receipt)", "shop → main: return \"thanks\""],
      shuffled: [3, 0, 4, 1, 2],
      hint: "Each call is closed by its return before the caller moves to its next line.",
      explain:
        "The diagram follows the code line by line: the call into `buy`, then `charge` and its return (the caller waits for it), then the next line of `buy` (the self-call to `log`), and finally `buy` returns. A return can never appear above the call it answers."
    },
    {
      type: "mcq",
      tag: "Read the diagram",
      prompt: "A message reads `[each item] reserve(item)` (in full UML, inside a `loop` box). What does it look like in code?",
      options: ["An `if` that calls `reserve` once when there is an item", "A `for` loop that calls `reserve` once per item", "A constructor call that creates an item", "A method that calls itself recursively"],
      answer: 1,
      hint: "loop means repeat.",
      explain:
        "A loop fragment, or a guard like `[each item]`, repeats its arrows, so it reads as a `for` loop. An `if` would be an `alt` or `opt` fragment. Creating an item would be a «create» arrow, and recursion would be a self-call."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "In an `alt` fragment with sections `[paid]` and `[else]`, how many of the two sections run in one scenario?",
      options: ["Both, one after the other", "Exactly one of them", "None; alt is only a comment", "As many times as the guard is true"],
      answer: 1,
      hint: "alt is short for alternatives.",
      explain:
        "`alt` is if / else: exactly one section runs, the first whose guard is true, otherwise `[else]`. Running both would be two separate arrows with no fragment. Repeating while a guard holds is a `loop`, not an `alt`."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "The diagram shows Checkout → Gateway: `charge(amount)`, then Gateway returns `\"PAID\"` to Checkout. Which line breaks it?",
      code: {
        lang: "scala",
        text:
          "class Gateway:\n  def charge(amount: Int): String = \"PAID\"\n\nclass Checkout(gateway: Gateway):\n  def pay(amount: Int): String =\n    gateway.refund(amount)\n\n@main def demo(): Unit = println(Checkout(Gateway()).pay(5))"
      },
      answer: 6,
      hint: "The arrow's label is the method that must be called.",
      explain:
        "Line 6 calls `refund`, but the arrow says `charge(amount)`, and Gateway has no `refund` method at all. The label of a call arrow must be a method of the class it points to. The other lines define the classes and start the scenario as the diagram expects."
    }
  ]
};

export default lesson;
