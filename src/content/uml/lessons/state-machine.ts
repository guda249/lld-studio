/**
 * UML Basics, lesson 6: state machine diagrams. Every code example runs as-is.
 */
import type { UmlLesson } from "../../guides/types";
import statesPy from "./code/state-machine-states.py?raw";
import statesScala from "./code/state-machine-states.scala?raw";
import initialPy from "./code/state-machine-initial.py?raw";
import initialScala from "./code/state-machine-initial.scala?raw";
import transitionPy from "./code/state-machine-transition.py?raw";
import transitionScala from "./code/state-machine-transition.scala?raw";
import selfPy from "./code/state-machine-self.py?raw";
import selfScala from "./code/state-machine-self.scala?raw";
import matchPy from "./code/state-machine-match.py?raw";
import matchScala from "./code/state-machine-match.scala?raw";
import patternPy from "./code/state-machine-pattern.py?raw";
import patternScala from "./code/state-machine-pattern.scala?raw";

const lesson: UmlLesson = {
  id: "state-machine",
  order: 6,
  title: "State machine diagrams",
  lede:
    "Some objects behave differently depending on where they are in their life: a locked door ignores `open`, a " +
    "cancelled order can't ship. A state machine diagram draws those **states** and the **events** that move the " +
    "object from one to the next. It is the map behind every `if state == …` in your code.",
  concepts: [
    {
      id: "states",
      name: "States and transitions",
      short: "Rounded boxes joined by arrows",
      notation: "( )",
      visual: {
        kind: "flow",
        spec: {
          width: 360,
          height: 344,
          label: "A door moves between Open and Closed with open and close, and between Closed and Locked with lock and unlock.",
          nodes: [
            { id: "open", kind: "state", label: "Open", x: 110, y: 20 },
            { id: "closed", kind: "state", label: "Closed", x: 110, y: 150 },
            { id: "locked", kind: "state", label: "Locked", x: 110, y: 280 }
          ],
          edges: [
            { id: "e-close", from: "open", to: "closed", label: "close", via: [[150, 107]], labelAt: [104, 111] },
            { id: "e-open", from: "closed", to: "open", label: "open", via: [[210, 107]], labelAt: [218, 111] },
            { id: "e-lock", from: "closed", to: "locked", label: "lock", via: [[150, 237]], labelAt: [112, 241] },
            { id: "e-unlock", from: "locked", to: "closed", label: "unlock", via: [[210, 237]], labelAt: [218, 241] }
          ]
        }
      },
      scene: [
        { say: "A **state** is a rounded box: a situation the object stays in until something happens. A door is Open, Closed or Locked, never two at once.", show: ["open", "closed", "locked"] },
        { say: "An arrow is a **transition**, labelled with the event that triggers it. `close` takes an open door to Closed; `open` brings it back.", show: ["e-close", "e-open"] },
        { say: "Notice what is missing: there is no arrow from Locked to Open. A locked door simply ignores `open`, and the diagram makes that rule visible.", show: ["e-lock", "e-unlock"] }
      ],
      what:
        "A state is a condition an object stays in for a while, drawn as a rounded box. A transition is an arrow from one state to another, labelled with the event that causes the move. Events that have no arrow out of the current state are ignored (or rejected).",
      spot:
        "A field that holds the current state, often an enum (`DoorState.CLOSED`), and methods that check that field before changing it: `if self.state == start: self.state = end`.",
      when:
        "Draw one when an object's answer to the same call depends on its history: orders, payments, tickets, doors, connections, game characters. If every method works the same whatever happened before, you don't need one.",
      code: { python: statesPy, scala: statesScala },
      hl: { python: [5, 6, 7, 12, 15, 16], scala: [2, 5, 8] }
    },
    {
      id: "initial-final",
      name: "Initial and final states",
      short: "Filled dot to start, bullseye to end",
      notation: "● ◉",
      visual: {
        kind: "flow",
        spec: {
          width: 360,
          height: 320,
          label: "An order starts as Placed; it is either delivered or cancelled, and both end the order's life.",
          nodes: [
            { id: "start", kind: "initial", x: 170, y: 10 },
            { id: "placed", kind: "state", label: "Placed", x: 110, y: 60 },
            { id: "delivered", kind: "state", label: "Delivered", x: 20, y: 180 },
            { id: "cancelled", kind: "state", label: "Cancelled", x: 200, y: 180 },
            { id: "end", kind: "final", x: 168, y: 276 }
          ],
          edges: [
            { id: "e-start", from: "start", to: "placed" },
            { id: "e-deliver", from: "placed", to: "delivered", label: "deliver", labelAt: [56, 140] },
            { id: "e-cancel", from: "placed", to: "cancelled", label: "cancel", labelAt: [236, 140] },
            { id: "e-d-end", from: "delivered", to: "end" },
            { id: "e-c-end", from: "cancelled", to: "end" }
          ]
        }
      },
      scene: [
        { say: "The filled dot is the **initial state**: where every new object begins. Its arrow points at the first real state, Placed.", show: ["start", "e-start", "placed"] },
        { say: "From Placed, two events lead to two different outcomes.", show: ["delivered", "cancelled", "e-deliver", "e-cancel"] },
        { say: "The bullseye is the **final state**: the object's story is over. No event can move it again.", show: ["end", "e-d-end", "e-c-end"] }
      ],
      what:
        "The initial state (a filled dot) marks where the object starts; it has exactly one arrow out and none in. The final state (a dot inside a ring) marks the end of the object's life; nothing leaves it. Arrows with no label happen as soon as the state is reached.",
      spot:
        "The initial arrow is the constructor setting the first state: `self.state = \"Placed\"`. The final state is a flag or check that refuses any further event once the object is done.",
      when:
        "Always draw the initial state, so readers know where to start. Draw a final state when objects really finish (an order, a payment, a game). Leave it out for things that cycle forever, like a traffic light.",
      code: { python: initialPy, scala: initialScala },
      hl: { python: [3, 7, 8], scala: [2, 6, 7] }
    },
    {
      id: "transition-label",
      name: "event [guard] / action",
      short: "The full label of a transition",
      notation: "[g]",
      visual: {
        kind: "flow",
        spec: {
          width: 360,
          height: 344,
          label: "A phone starts Locked. A pin with the right code unlocks it, the third wrong pin blocks it, and a timeout locks it again.",
          nodes: [
            { id: "start", kind: "initial", x: 30, y: 152 },
            { id: "blocked", kind: "state", label: "Blocked", x: 110, y: 20 },
            { id: "locked", kind: "state", label: "Locked", x: 110, y: 140 },
            { id: "unlocked", kind: "state", label: "Unlocked", x: 110, y: 280 }
          ],
          edges: [
            { id: "e-start", from: "start", to: "locked" },
            { id: "e-unlock", from: "locked", to: "unlocked", label: "pin [ok] / unlock", via: [[210, 232]], labelAt: [218, 236] },
            { id: "e-lock", from: "unlocked", to: "locked", label: "timeout / lock", via: [[150, 232]], labelAt: [40, 236] },
            { id: "e-block", from: "locked", to: "blocked", label: "pin [3 wrong] / alarm", labelAt: [188, 106] }
          ]
        }
      },
      scene: [
        { say: "The phone starts Locked. The label `pin [ok] / unlock` has three parts: the **event** (`pin`), the **guard** in brackets (`ok`), and the **action** after the slash (`unlock`).", show: ["start", "e-start", "locked", "unlocked", "e-unlock"] },
        { say: "The guard is a yes/no check. The same `pin` event leads somewhere else when a different guard is true: the third wrong pin blocks the phone and sounds the alarm.", show: ["blocked", "e-block"] },
        { say: "Guard and action are optional. `timeout / lock` has no guard, so every timeout in Unlocked takes the phone back to Locked.", show: ["e-lock"] }
      ],
      what:
        "A transition label reads `event [guard] / action`. The event is what happens (a method call, a message, a timer). The guard is a condition that must be true for this arrow to be taken. The action is what the object does while moving. Each part is optional.",
      spot:
        "The event is the method (`pin(p)`), the guard is the `if` inside it (`if p == self.code`), and the action is the code that runs right before or after the state field changes (`print(\"action: unlock\")`).",
      when:
        "Add a guard when one event can lead to different states. Add an action when moving has a side effect worth knowing (send an email, refund, sound an alarm). Keep labels short; put long logic in a method and name that method.",
      code: { python: transitionPy, scala: transitionScala },
      hl: { python: [5, 8, 9, 10, 13], scala: [5, 7, 8, 9, 12] }
    },
    {
      id: "self-transition",
      name: "Self-transition",
      short: "An arrow back to the same state",
      notation: "⟲",
      visual: {
        kind: "flow",
        spec: {
          width: 360,
          height: 310,
          label: "A vending machine goes from Idle to Collecting on a coin, stays in Collecting for every further coin, and vends on pick when credit is at least 50.",
          nodes: [
            { id: "start", kind: "initial", x: 120, y: 10 },
            { id: "idle", kind: "state", label: "Idle", x: 60, y: 60 },
            { id: "collecting", kind: "state", label: "Collecting", x: 60, y: 200 }
          ],
          edges: [
            { id: "e-start", from: "start", to: "idle" },
            { id: "e-coin", from: "idle", to: "collecting", label: "coin / add", via: [[100, 152]], labelAt: [20, 156] },
            { id: "e-vend", from: "collecting", to: "idle", label: "pick [credit ≥ 50] / vend", via: [[160, 152]], labelAt: [168, 156] },
            { id: "e-self", from: "collecting", to: "collecting", label: "coin / credit += value", via: [[80, 244], [80, 278], [130, 278]], labelAt: [52, 298] }
          ]
        }
      },
      scene: [
        { say: "The first coin moves the machine from Idle to Collecting.", show: ["start", "e-start", "idle", "collecting", "e-coin"] },
        { say: "Every next coin is a **self-transition**: the arrow leaves Collecting and comes straight back. The state stays the same, but the action still runs and the credit grows.", show: ["e-self"] },
        { say: "Only `pick` with enough credit leaves Collecting: the machine vends and goes back to Idle.", show: ["e-vend"] }
      ],
      what:
        "A self-transition is an arrow that starts and ends on the same state. The object handles the event and runs the action, but stays where it is. It is different from ignoring the event: something does happen.",
      spot:
        "A method that changes data (a counter, a total, a list) without changing the state field: `self.credit += value` while the state stays \"Collecting\".",
      when:
        "Draw it when an event matters in a state but doesn't change the state: adding items to an open cart, retrying a connection, a wrong pin that only counts the attempt.",
      code: { python: selfPy, scala: selfScala },
      hl: { python: [9, 10], scala: [7, 8] }
    },
    {
      id: "enum-match",
      name: "In code: an enum + match",
      short: "One case per arrow",
      notation: "case",
      visual: {
        kind: "flow",
        spec: {
          width: 360,
          height: 340,
          label: "An order goes Placed, Paid, Shipped. It can be cancelled from Placed, or from Paid with a refund.",
          nodes: [
            { id: "start", kind: "initial", x: 80, y: 10 },
            { id: "placed", kind: "state", label: "Placed", x: 20, y: 60 },
            { id: "paid", kind: "state", label: "Paid", x: 20, y: 170 },
            { id: "shipped", kind: "state", label: "Shipped", x: 20, y: 280 },
            { id: "cancelled", kind: "state", label: "Cancelled", x: 190, y: 280, w: 130 }
          ],
          edges: [
            { id: "e-start", from: "start", to: "placed" },
            { id: "e-pay", from: "placed", to: "paid", label: "pay", labelAt: [96, 141] },
            { id: "e-ship", from: "paid", to: "shipped", label: "ship", labelAt: [96, 251] },
            { id: "e-cancel", from: "placed", to: "cancelled", label: "cancel", via: [[340, 82], [340, 302]], labelAt: [250, 76] },
            { id: "e-refund", from: "paid", to: "cancelled", label: "cancel / refund", via: [[255, 192]], labelAt: [166, 186] }
          ]
        }
      },
      scene: [
        { say: "Each state box becomes one value of an **enum**: Placed, Paid, Shipped, Cancelled.", show: ["start", "e-start", "placed", "paid", "shipped", "cancelled"] },
        { say: "Each arrow becomes one **case** of a `match` on (current state, event). `(Placed, \"pay\")` gives Paid.", show: ["e-pay", "e-ship"] },
        { say: "Two arrows with the same event are two cases. The action, `refund`, runs inside its case. Anything without an arrow falls into the last case and is rejected.", show: ["e-cancel", "e-refund"] }
      ],
      what:
        "The simplest way to code a state machine: an enum for the states, a field for the current state, and one function that matches on the pair (state, event) and returns the next state. The diagram and the `match` have the same shape: one case per arrow.",
      spot:
        "An `Enum` (Python) or `enum` (Scala) of states, and a `match` / `if` chain on the current state and the event. The fallback case (`case _`) is every arrow that is not drawn.",
      when:
        "Use it for small machines with little behaviour per state. When each state needs several methods with real logic, the `match` grows in every method; that is the moment to switch to the State pattern.",
      code: { python: matchPy, scala: matchScala },
      hl: { python: [12, 13, 14, 19, 20, 21], scala: [5, 6, 9, 10, 11] }
    },
    {
      id: "state-pattern",
      name: "In code: the State pattern",
      short: "One class per state",
      notation: "▷",
      visual: {
        kind: "class",
        uml: {
          classes: [
            { name: "Player", kind: "concrete", members: ["- state: PlayerState", "+ press()"] },
            { name: "PlayerState", kind: "interface", members: ["+ press(player)"] },
            { name: "Playing", kind: "concrete", members: ["+ press(player)"] },
            { name: "Paused", kind: "concrete", members: ["+ press(player)"] }
          ],
          relations: [
            { from: "Player", to: "PlayerState", type: "association" },
            { from: "Playing", to: "PlayerState", type: "realization" },
            { from: "Paused", to: "PlayerState", type: "realization" }
          ]
        }
      },
      scene: [
        { say: "The object with states, the music `Player`, keeps its current state as a **field** of an interface type.", show: ["Player", "PlayerState", "Player>PlayerState"] },
        { say: "Each state box of the state machine becomes **one class** that implements the interface: Playing and Paused.", show: ["Playing", "Paused", "Playing>PlayerState", "Paused>PlayerState"] },
        { say: "A transition is just swapping the object in the field: Playing's `press` puts a new Paused there. The player itself has no `if` at all." , show: [] }
      ],
      what:
        "The State pattern turns each state into a class. The context object (here `Player`) delegates every event to its current state object, and a state object performs a transition by putting a different state object into the context.",
      spot:
        "An interface or trait for the state, one class per state, a context with a `state` field of that type, and methods that call `self.state.press(self)` instead of checking an enum.",
      when:
        "Use it when states have a lot of behaviour or you keep adding states: each new state is a new class, and existing ones don't change. For two or three states with one-line behaviour, the enum + match is shorter and clearer.",
      code: { python: patternPy, scala: patternScala },
      hl: { python: [4, 11, 21, 24], scala: [1, 6, 13, 14] }
    }
  ],
  practiceTitle: "Practice: read the state machine",
  practice: [
    {
      type: "mcq",
      tag: "Read the diagram",
      prompt: "A transition is labelled `pay [amount ≥ total] / send receipt`. Which part is the guard?",
      options: ["`pay`", "`amount ≥ total`", "`send receipt`"],
      answer: 1,
      hint: "Guards are written in square brackets.",
      explain:
        "The guard is the condition in square brackets, `amount ≥ total`; the arrow is taken only when it is true. `pay` is the event that triggers the check, and `send receipt` after the slash is the action that runs while moving."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "A door is in Locked. The diagram has no arrow from Locked labelled `open`. What happens when `open` is called?",
      options: ["The door opens anyway", "The event is ignored or rejected; the door stays Locked", "The door goes to the final state", "The door goes back to the initial state"],
      answer: 1,
      hint: "Arrows list what can happen in each state.",
      explain:
        "Only the events drawn on arrows leaving the current state do anything. With no `open` arrow out of Locked, the event is ignored (or the code raises an error). The door doesn't open, end its life, or restart; those would all need arrows."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "What does a self-transition such as `coin / credit += value` on Collecting mean?",
      options: ["The coin is ignored", "The machine leaves Collecting and never comes back", "The machine stays in Collecting but runs the action", "The machine goes to the initial state"],
      answer: 2,
      hint: "The arrow starts and ends on the same box.",
      explain:
        "A self-transition handles the event and runs its action, but the state stays the same. Ignoring the event would be no arrow at all. Leaving Collecting would need an arrow to another state, and the initial dot is never the target of a transition."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "The diagram says: Placed → Paid on `pay`, Paid → Shipped on `ship`, and nothing else. Which line lets the order do something the diagram forbids?",
      code: {
        lang: "python",
        text:
          "def next_status(s: str, event: str) -> str:\n    match (s, event):\n        case (\"Placed\", \"pay\"):\n            return \"Paid\"\n        case (\"Paid\", \"ship\"):\n            return \"Shipped\"\n        case (_, \"ship\"):\n            return \"Shipped\"\n        case _:\n            raise ValueError(event)\n\nprint(next_status(\"Placed\", \"pay\"))"
      },
      answer: 7,
      hint: "Look for a case that matches more states than the arrow allows.",
      explain:
        "Line 7 matches `ship` in **any** state, so an unpaid Placed order could ship. The diagram has only one `ship` arrow, out of Paid, which line 5 already covers. Lines 3 and 5 are the two drawn arrows, and line 9 rejects everything else, as it should."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "The diagram: Locked → Unlocked on `pin [ok] / unlock`. Which line breaks the guard?",
      code: {
        lang: "scala",
        text:
          "class Phone(code: String):\n  var state = \"Locked\"\n\n  def pin(p: String): Unit =\n    if state == \"Locked\" then\n      state = \"Unlocked\"\n      println(\"unlock\")\n\n@main def demo(): Unit =\n  val phone = Phone(\"1234\")\n  phone.pin(\"0000\")\n  println(phone.state)"
      },
      answer: 6,
      hint: "Where is `[ok]` checked?",
      explain:
        "Line 6 changes the state without checking the guard `p == code`, so any pin unlocks the phone (the demo prints Unlocked for 0000). The check on line 5 is the source state, not the guard. Line 7 is the action, which is fine once the guard is in place."
    },
    {
      type: "order",
      tag: "Put in order",
      prompt: "Turn a state machine diagram into enum + match code. Put the steps in order.",
      steps: [
        "Make an enum with one value per state box",
        "Give the class a field that holds the current state, set to the initial state",
        "Write a match on (current state, event) with one case per arrow",
        "Run each arrow's action inside its case",
        "Add a last case that rejects events with no arrow"
      ],
      shuffled: [2, 0, 4, 1, 3],
      hint: "You need the states before you can store one.",
      explain:
        "States come first (the enum), then the field that the initial arrow sets. The match needs both, then each case gets its action, and the fallback for undrawn arrows comes last because `case _` must be the final case."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "Your media player has 6 states, and each state handles 5 events with real logic. With enum + match, every method has a 6-way match. What would you choose?",
      options: ["Keep the enum + match; it is always clearer", "The State pattern: one class per state that implements the events", "Remove the states and use booleans like `is_playing`", "Draw a sequence diagram instead"],
      answer: 1,
      hint: "Where would a 7th state have to be added?",
      explain:
        "With many states and real behaviour, the State pattern puts each state's logic in one class, and a new state is a new class. The enum + match would spread every state across 5 methods. Booleans make impossible combinations possible, and a sequence diagram describes one scenario, not the states."
    },
    {
      type: "mcq",
      tag: "Read the diagram",
      prompt: "What does the filled black dot in a state machine diagram stand for in code?",
      options: ["The constructor setting the first state", "A method that ends the object's life", "An `if` with no `else`", "A loop that waits for events"],
      answer: 0,
      hint: "Every new object has to start somewhere.",
      explain:
        "The filled dot is the initial state: its single arrow is the constructor setting the starting state, like `self.state = \"Placed\"`. Ending the life is the final state (a bullseye). A guard is the `if`, and an event loop is not drawn as a node."
    }
  ]
};

export default lesson;
