/**
 * UML Basics, lesson 7: activity diagrams (how work flows) and use-case diagrams (who uses the system for what).
 * All visuals are `flow` diagrams, at most 360 wide. Every code example runs as-is.
 */
import type { UmlLesson } from "../../guides/types";
import actionsPy from "./code/activity-usecase-actions.py?raw";
import actionsScala from "./code/activity-usecase-actions.scala?raw";
import decisionPy from "./code/activity-usecase-decision.py?raw";
import decisionScala from "./code/activity-usecase-decision.scala?raw";
import forkPy from "./code/activity-usecase-fork.py?raw";
import forkScala from "./code/activity-usecase-fork.scala?raw";
import lanesPy from "./code/activity-usecase-lanes.py?raw";
import lanesScala from "./code/activity-usecase-lanes.scala?raw";
import useCasesPy from "./code/activity-usecase-usecases.py?raw";
import useCasesScala from "./code/activity-usecase-usecases.scala?raw";
import includePy from "./code/activity-usecase-include.py?raw";
import includeScala from "./code/activity-usecase-include.scala?raw";

const lesson: UmlLesson = {
  id: "activity-usecase",
  order: 7,
  title: "Activity & use case diagrams",
  lede:
    "An **activity diagram** is a flowchart with rules: it shows the steps of a piece of work, where it branches and what runs at the same time. A **use-case diagram** steps back further: it shows who uses the system and what they can do with it, without any steps at all.",
  concepts: [
    {
      id: "actions",
      name: "Actions, start and end",
      short: "Rounded boxes joined by arrows",
      notation: "● ▭ ◉",
      visual: {
        kind: "flow",
        spec: {
          width: 360,
          height: 280,
          label: "Activity diagram: start, then add items to cart, pay for order, send receipt, then end.",
          nodes: [
            { id: "start", kind: "initial", x: 170, y: 10 },
            { id: "add", kind: "action", label: "Add items to cart", x: 105, y: 54 },
            { id: "pay", kind: "action", label: "Pay for order", x: 105, y: 118 },
            { id: "receipt", kind: "action", label: "Send receipt", x: 105, y: 182 },
            { id: "end", kind: "final", x: 168, y: 246 }
          ],
          edges: [
            { id: "e1", from: "start", to: "add" },
            { id: "e2", from: "add", to: "pay" },
            { id: "e3", from: "pay", to: "receipt" },
            { id: "e4", from: "receipt", to: "end" }
          ]
        }
      },
      scene: [
        { say: "The filled dot is where the work starts. There is exactly one way in, so a reader always knows where to begin.", show: ["start", "e1", "add"] },
        { say: "Each rounded box is an **action**: one thing that gets done. Arrows show the order, so pay only happens after the cart is filled.", show: ["e2", "pay", "e3", "receipt"] },
        { say: "The bullseye is the end. When the flow reaches it, the whole activity is finished.", show: ["e4", "end"] }
      ],
      what:
        "An activity diagram shows a piece of work as a chain of **actions** (rounded boxes) joined by arrows. A filled dot marks the start; a bullseye (dot inside a ring) marks the end.",
      spot:
        "A function that does several steps one after another. Each call or block in its body is an action; the call is the start, and `return` is the end.",
      when:
        "Use it to agree on a workflow before you code it, such as checkout, sign-up or a refund, especially with people who don't read code.",
      code: { python: actionsPy, scala: actionsScala },
      hl: { python: [14, 16, 17, 18, 19], scala: [12, 14, 15, 16, 17] }
    },
    {
      id: "decision",
      name: "Decision and merge",
      short: "A diamond splits the path; another joins it",
      notation: "◇ [guard]",
      visual: {
        kind: "flow",
        spec: {
          width: 360,
          height: 400,
          label: "Activity diagram: check stock, then a decision. In stock goes to ship now, out of stock goes to back-order. Both paths merge, then send receipt and end.",
          nodes: [
            { id: "start", kind: "initial", x: 170, y: 10 },
            { id: "check", kind: "action", label: "Check stock", x: 105, y: 54 },
            { id: "dec", kind: "decision", x: 162, y: 118 },
            { id: "ship", kind: "action", label: "Ship now", x: 10, y: 178 },
            { id: "back", kind: "action", label: "Back-order", x: 200, y: 178 },
            { id: "merge", kind: "merge", x: 162, y: 242 },
            { id: "receipt", kind: "action", label: "Send receipt", x: 105, y: 302 },
            { id: "end", kind: "final", x: 168, y: 366 }
          ],
          edges: [
            { id: "e1", from: "start", to: "check" },
            { id: "e2", from: "check", to: "dec" },
            { id: "e3", from: "dec", to: "ship", label: "[in stock]", via: [[85, 136]], labelAt: [86, 129] },
            { id: "e4", from: "dec", to: "back", label: "[out of stock]", via: [[275, 136]], labelAt: [202, 129] },
            { id: "e5", from: "ship", to: "merge", via: [[85, 260]] },
            { id: "e6", from: "back", to: "merge", via: [[275, 260]] },
            { id: "e7", from: "merge", to: "receipt" },
            { id: "e8", from: "receipt", to: "end" }
          ]
        }
      },
      scene: [
        { say: "After checking stock, the flow reaches a diamond: a **decision**. Only one way out will be taken.", show: ["start", "e1", "check", "e2", "dec"] },
        { say: "Each way out has a **guard** in square brackets. Guards must not overlap, so exactly one path is true each time.", show: ["e3", "ship", "e4", "back"] },
        { say: "A second diamond, the **merge**, brings the paths back together. It doesn't wait; whichever path arrives just carries on to the receipt.", show: ["e5", "e6", "merge", "e7", "receipt", "e8", "end"] }
      ],
      what:
        "A **decision** diamond has one arrow in and several out, each with a `[guard]` (a yes/no condition). A **merge** diamond has several arrows in and one out; it joins paths that split earlier.",
      spot:
        "An `if` / `else` (or `match`) is a decision; the guards are its conditions. The first line after the whole `if` block is where the merge sits.",
      when:
        "Use it whenever the work can go more than one way. Write the guards so they cover every case and never overlap, just like good `if` conditions.",
      code: { python: decisionPy, scala: decisionScala },
      hl: { python: [6, 7, 8, 9, 10], scala: [5, 6, 7, 8, 9] }
    },
    {
      id: "fork",
      name: "Fork and join",
      short: "Thick bars for work that runs in parallel",
      notation: "▬ ▬",
      visual: {
        kind: "flow",
        spec: {
          width: 360,
          height: 340,
          label: "Activity diagram: take order, then a fork bar starts pack box and take payment at the same time. A join bar waits for both, then ship order and end.",
          nodes: [
            { id: "start", kind: "initial", x: 170, y: 10 },
            { id: "take", kind: "action", label: "Take order", x: 105, y: 54 },
            { id: "forkbar", kind: "fork", x: 30, y: 118, w: 300 },
            { id: "pack", kind: "action", label: "Pack box", x: 20, y: 148, w: 140 },
            { id: "payment", kind: "action", label: "Take payment", x: 200, y: 148, w: 140 },
            { id: "joinbar", kind: "join", x: 30, y: 212, w: 300 },
            { id: "ship", kind: "action", label: "Ship order", x: 105, y: 242 },
            { id: "end", kind: "final", x: 168, y: 306 }
          ],
          edges: [
            { id: "e1", from: "start", to: "take" },
            { id: "e2", from: "take", to: "forkbar" },
            { id: "e3", from: "forkbar", to: "pack", via: [[90, 124]] },
            { id: "e4", from: "forkbar", to: "payment", via: [[270, 124]] },
            { id: "e5", from: "pack", to: "joinbar", via: [[90, 212]] },
            { id: "e6", from: "payment", to: "joinbar", via: [[270, 212]] },
            { id: "e7", from: "joinbar", to: "ship" },
            { id: "e8", from: "ship", to: "end" }
          ]
        }
      },
      scene: [
        { say: "After the order is taken, the flow hits a thick bar: a **fork**. One arrow goes in and two come out.", show: ["start", "e1", "take", "e2", "forkbar"] },
        { say: "Both paths start at once. Packing doesn't wait for payment, and payment doesn't wait for packing, so the order is ready sooner.", show: ["e3", "pack", "e4", "payment"] },
        { say: "The second bar is a **join**. Unlike a merge, it waits until **every** path has arrived; only then can the order ship.", show: ["e5", "e6", "joinbar", "e7", "ship", "e8", "end"] }
      ],
      what:
        "A **fork** bar splits one flow into paths that run at the same time (in parallel). A **join** bar waits for all of those paths to finish before the flow goes on.",
      spot:
        "Threads, futures, `async` tasks or a thread pool: starting them is the fork; waiting for all the results (`result()`, `Await`, `gather`) is the join.",
      when:
        "Use it when steps don't depend on each other and can overlap. Don't confuse it with a decision: a decision takes **one** path; a fork takes **all** of them.",
      code: { python: forkPy, scala: forkScala },
      hl: { python: [16, 17, 18, 19], scala: [15, 16, 17, 18] }
    },
    {
      id: "lanes",
      name: "Swim lanes",
      short: "Columns that say who does each action",
      notation: "│ lane │",
      visual: {
        kind: "flow",
        spec: {
          width: 360,
          height: 380,
          label: "Activity diagram in two swim lanes. Customer lane: place order. Shop lane: accept order, then pack and ship. Back in the customer lane: receive parcel, then end.",
          nodes: [
            { id: "laneC", kind: "boundary", label: "Customer", x: 4, y: 4, w: 172, h: 368 },
            { id: "laneS", kind: "boundary", label: "Shop", x: 184, y: 4, w: 172, h: 368 },
            { id: "start", kind: "initial", x: 80, y: 36 },
            { id: "place", kind: "action", label: "Place order", x: 15, y: 80 },
            { id: "accept", kind: "action", label: "Accept order", x: 195, y: 144 },
            { id: "packship", kind: "action", label: "Pack and ship", x: 195, y: 208 },
            { id: "receive", kind: "action", label: "Receive parcel", x: 15, y: 272 },
            { id: "end", kind: "final", x: 78, y: 336 }
          ],
          edges: [
            { id: "e1", from: "start", to: "place" },
            { id: "e2", from: "place", to: "accept", via: [[90, 164]] },
            { id: "e3", from: "accept", to: "packship" },
            { id: "e4", from: "packship", to: "receive", via: [[270, 292]] },
            { id: "e5", from: "receive", to: "end" }
          ]
        }
      },
      scene: [
        { say: "Split the diagram into columns, one per role. Each column is a **swim lane**, like lanes in a pool.", show: ["laneC", "laneS"] },
        { say: "Every action sits in the lane of whoever does it. The customer places the order, so that box lives in the Customer lane.", show: ["start", "e1", "place"] },
        { say: "When an arrow crosses into another lane, the work changes hands. These hand-offs are where delays and bugs usually hide.", show: ["e2", "accept", "e3", "packship"] },
        { say: "The parcel crosses back to the customer, and the activity ends in their lane.", show: ["e4", "receive", "e5", "end"] }
      ],
      what:
        "**Swim lanes** split an activity diagram into columns (or rows), one per person, team or system. Each action is drawn in the lane of whoever is responsible for it. The arrows still show the order.",
      spot:
        "Group the steps by the class or service that runs them. Each class is a lane; a call from one class into another is an arrow crossing lanes.",
      when:
        "Use lanes when more than one party takes part and you need to show who does what, and where the work is handed over. For a one-person flow, leave them out.",
      code: { python: lanesPy, scala: lanesScala },
      hl: { python: [1, 2, 6, 10, 11, 14], scala: [1, 2, 6, 9, 10, 13] }
    },
    {
      id: "usecases",
      name: "Actors, use cases, boundary",
      short: "Who uses the system, and for what",
      notation: "웃 ⬭ ▢",
      visual: {
        kind: "flow",
        spec: {
          width: 360,
          height: 340,
          label: "Use-case diagram: a Shop app boundary holds four use cases. The Customer actor connects to browse products, place order and track order. The Admin actor connects to add product.",
          nodes: [
            { id: "system", kind: "boundary", label: "Shop app", x: 100, y: 8, w: 252, h: 318 },
            { id: "customer", kind: "actor", label: "Customer", x: 12, y: 70 },
            { id: "admin", kind: "actor", label: "Admin", x: 12, y: 240 },
            { id: "browse", kind: "usecase", label: "Browse products", x: 160, y: 44 },
            { id: "order", kind: "usecase", label: "Place order", x: 160, y: 114 },
            { id: "track", kind: "usecase", label: "Track order", x: 160, y: 184 },
            { id: "addp", kind: "usecase", label: "Add product", x: 160, y: 254 }
          ],
          edges: [
            { id: "c1", from: "customer", to: "browse", arrow: "none" },
            { id: "c2", from: "customer", to: "order", arrow: "none" },
            { id: "c3", from: "customer", to: "track", arrow: "none" },
            { id: "a1", from: "admin", to: "addp", arrow: "none" }
          ]
        }
      },
      scene: [
        { say: "The rectangle is the **system boundary**. Everything inside is what the Shop app does; everything outside is not our job.", show: ["system"] },
        { say: "A stick figure is an **actor**: a role that uses the system from outside. It can be a person or another system, like a payment provider.", show: ["customer", "admin"] },
        { say: "Each oval is a **use case**: one goal an actor can reach, named with a verb. Plain lines show which actor does which.", show: ["browse", "order", "track", "addp", "c1", "c2", "c3", "a1"] }
      ],
      what:
        "A use-case diagram shows **actors** (stick figures: roles outside the system), **use cases** (ovals: goals, named as verbs) and the **system boundary** (a box around the use cases). A plain line means the actor takes part in that use case.",
      spot:
        "The public operations of an app or service are its use cases; whoever calls them (a user role, another service) is an actor. Different roles calling different methods means different actors.",
      when:
        "Use it at the very start, to agree on scope: who uses the system and for what. It has no order and no steps; for those, draw an activity or sequence diagram.",
      code: { python: useCasesPy, scala: useCasesScala },
      hl: { python: [1, 2, 4, 7, 10, 13, 18, 22], scala: [2, 3, 4, 5, 6, 10, 14] }
    },
    {
      id: "include-extend",
      name: "«include» and «extend»",
      short: "Always part of it, or only sometimes",
      notation: "«include»",
      visual: {
        kind: "flow",
        spec: {
          width: 360,
          height: 300,
          label: "Use-case diagram: Customer connects to place order. Place order includes log in. Apply coupon extends place order.",
          nodes: [
            { id: "system", kind: "boundary", label: "Shop app", x: 100, y: 8, w: 252, h: 282 },
            { id: "customer", kind: "actor", label: "Customer", x: 12, y: 131 },
            { id: "coupon", kind: "usecase", label: "Apply coupon", x: 160, y: 44 },
            { id: "order", kind: "usecase", label: "Place order", x: 160, y: 134 },
            { id: "login", kind: "usecase", label: "Log in", x: 160, y: 224 }
          ],
          edges: [
            { id: "c1", from: "customer", to: "order", arrow: "none" },
            { id: "inc", from: "order", to: "login", dashed: true, label: "«include»", labelAt: [242, 208] },
            { id: "ext", from: "coupon", to: "order", dashed: true, label: "«extend»", labelAt: [242, 118] }
          ]
        }
      },
      scene: [
        { say: "Start with the main goal: the customer places an order.", show: ["system", "customer", "c1", "order"] },
        { say: "Placing an order **always** needs logging in. A dashed arrow marked «include» points from the base use case to the part it always uses.", show: ["inc", "login"] },
        { say: "A coupon is **optional**. «extend» points the other way, from the extra behaviour to the base, because the base works fine without it.", show: ["ext", "coupon"] }
      ],
      what:
        "**«include»**: the base use case always runs the included one (arrow from base to included). **«extend»**: the extending use case adds optional behaviour to the base, only under some condition (arrow from extension to base). Both are dashed arrows.",
      spot:
        "A step the method always calls is an «include». A step behind an `if` or an `Option` (only when the user asked for it) is an «extend».",
      when:
        "Use «include» to pull out a step shared by several use cases (log in, pay). Use «extend» for optional extras. Use them sparingly; a diagram full of them is harder to read than the code.",
      code: { python: includePy, scala: includeScala },
      hl: { python: [9, 10, 11], scala: [7, 8] }
    }
  ],
  practiceTitle: "Practice: activity and use-case diagrams",
  practice: [
    {
      type: "mcq",
      tag: "Concept",
      prompt: "In an activity diagram, what is the difference between a merge diamond and a join bar?",
      options: [
        "A merge goes on as soon as one path arrives; a join waits for all paths",
        "A merge waits for all paths; a join goes on as soon as one arrives",
        "They mean the same thing; the shape is a matter of style",
        "A merge is for use-case diagrams; a join is for activity diagrams"
      ],
      answer: 0,
      hint: "Think about which one comes after a decision and which one comes after a fork.",
      explain:
        "A merge closes a decision: only one path was taken, so there is nothing to wait for. A join closes a fork: all paths run in parallel, so it waits for every one. They are not the same, and both belong to activity diagrams."
    },
    {
      type: "mcq",
      tag: "Read the diagram",
      prompt: "Which code shape does a decision diamond with the guards [paid] and [not paid] stand for?",
      options: ["Two threads started together", "An if / else on whether the order is paid", "A loop that runs twice", "A class with two subclasses"],
      answer: 1,
      hint: "Only one of the two paths is taken each time.",
      explain:
        "A decision takes exactly one way out, picked by its guards, which is what if / else does. Two threads would be a fork. A loop is drawn with an arrow going back up to an earlier action. Subclasses belong in a class diagram, not an activity diagram."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "Which of these is a good actor for a library system's use-case diagram?",
      options: ["Borrow book", "Member", "Database table loans", "Book class"],
      answer: 1,
      hint: "Actors are roles outside the system that use it.",
      explain:
        "An actor is a role outside the system, like Member. \"Borrow book\" is a use case (a goal, named with a verb). A database table and the Book class are parts inside the system, not users of it."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "Every time a user withdraws cash, the ATM must check their PIN. How do you draw this?",
      options: [
        "\"Withdraw cash\" «include» \"Check PIN\" (arrow from Withdraw cash to Check PIN)",
        "\"Check PIN\" «extend» \"Withdraw cash\" (arrow from Check PIN to Withdraw cash)",
        "A fork bar between the two use cases",
        "A second actor called Check PIN"
      ],
      answer: 0,
      hint: "Is the PIN check always done, or only sometimes?",
      explain:
        "The PIN check always happens, so it is «include», with the arrow from the base (Withdraw cash) to the included part. «extend» is for optional extras. Fork bars belong in activity diagrams. Check PIN is something the system does, not a role outside it."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "The diagram says \"Pack box\" and \"Take payment\" run in parallel between a fork and a join. Which line breaks that promise?",
      code: {
        lang: "python",
        text:
          "from concurrent.futures import ThreadPoolExecutor\n\ndef pack_box() -> str: return \"packed\"\ndef take_payment() -> str: return \"paid\"\n\nwith ThreadPoolExecutor() as pool:\n    packed = pool.submit(pack_box).result()\n    paid = pool.submit(take_payment)\n    print(packed, paid.result())"
      },
      answer: 7,
      hint: "Look for a wait that happens before the second task has even started.",
      explain:
        "Line 7 calls .result() straight away, so it waits for packing to finish before payment is submitted on line 8. That is two actions in a row, not a fork. The fix is to submit both first and call .result() on both afterwards (the join)."
    },
    {
      type: "order",
      tag: "Put in order",
      prompt: "Put the parts of this activity diagram in order from top to bottom.",
      steps: ["Initial node (filled dot)", "Action: Take order", "Fork bar", "Actions: Pack box and Take payment", "Join bar", "Final node (bullseye)"],
      shuffled: [2, 5, 0, 4, 1, 3],
      hint: "Start with the dot and end with the bullseye; the bars wrap the parallel part.",
      explain:
        "The flow starts at the filled dot, takes the order, then the fork starts both parallel actions. The join waits for both, and the bullseye ends the activity. Putting the join before the fork, or an action after the final node, would make no sense."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "What does a swim lane tell the reader?",
      options: ["Which actions run in parallel", "Who is responsible for each action", "Which use cases are optional", "How long each action takes"],
      answer: 1,
      hint: "Think of lanes in a pool: one swimmer per lane.",
      explain:
        "A lane is one person, team or system, and every action sits in the lane of whoever does it. Parallel work is shown with fork and join bars, optional use cases with «extend», and UML activity diagrams don't show durations."
    }
  ]
};

export default lesson;
