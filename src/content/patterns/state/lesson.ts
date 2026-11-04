import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-vending.py?raw";
import ex1Scala from "./code/ex1-vending.scala?raw";
import ex2Py from "./code/ex2-player.py?raw";
import ex2Scala from "./code/ex2-player.scala?raw";
import ex3Py from "./code/ex3-review.py?raw";
import ex3Scala from "./code/ex3-review.scala?raw";
import ex4Py from "./code/ex4-payment.py?raw";
import ex4Scala from "./code/ex4-payment.scala?raw";

const lesson: PatternLesson = {
  slug: "state",
  analogy:
    "A food-delivery order. \"Cancel\" works while the order is placed, is refused once it is out for delivery, and makes no sense after it is delivered. Same button, different behaviour depending on where the order is in its life.",
  problem: {
    text: "Order checks its status string with if/elif in every method: ship, deliver, cancel and later refund. The rules for one status are scattered across all of them, a missed case fails silently, and adding a new \"packed\" status means editing every method.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Give each state its own class. Each class implements only the actions that are valid in that state and returns the next state; everything else falls back to a default that refuses the action. The context (Order) holds the current state object and simply delegates each action to it. To callers it looks as if the order changed class.",
  participants: [
    { role: "Context", name: "Order", kind: "concrete", description: "Holds the current state, delegates every action to it and stores whatever state comes back." },
    { role: "State", name: "OrderState", kind: "abstract", description: "Declares all actions. By default each one refuses with a clear error message." },
    { role: "Concrete state", name: "Placed, Shipped, Delivered, Cancelled", kind: "concrete", description: "Override only the actions that are valid for them and decide which state comes next. In Scala they are case objects, because they hold no data." },
    { role: "Client", name: "Demo code", kind: "client", description: "Calls ship(), deliver() or cancel() on the order without checking its status first." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "When states have no behaviour beyond their transitions, write the state machine as data: an enum of states and a transition table, a dict of (state, event) to next state in Python or a pure function with pattern matching in Scala. It is easy to test and to draw. Use State classes when each state carries real logic.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "TCP connection states (listen, established, closed) in network stacks.",
    "Order, payment and ticket workflows; document approval (draft, review, published).",
    "Vending machines, traffic lights and media players (playing, paused, stopped).",
    "Workflow engines such as AWS Step Functions, and the python-transitions library.",
  ],
  whenToUse: [
    "Behaviour depends heavily on state, and the same if state == ... check appears in many methods.",
    "States and transitions are a core part of the domain and will keep growing.",
  ],
  whenNotToUse: [
    "Two or three states with trivial behaviour: an enum and an if are clearer.",
    "Transitions are simple data: a transition table is lighter than a class per state.",
  ],
  pros: [
    "Each state's rules live in one place (Single Responsibility); new states without editing others (Open/Closed).",
    "Invalid transitions are refused by design instead of being forgotten in an if/elif chain.",
  ],
  cons: [
    "More classes, and the transitions are spread across them, so keep a state diagram next to the code.",
    "Overkill for a handful of simple states.",
  ],
  confusedWith: [
    { name: "Strategy", difference: "Same class diagram. A strategy is chosen from outside by the client and strategies do not know each other; states switch themselves and know which state comes next." },
    { name: "Command", difference: "A command wraps one action as an object; a state groups all the actions that are valid at one point in an object's life." },
  ],
  solid:
    "Single Responsibility (each state class holds one state's rules), Open/Closed (add a state without editing the others) and Liskov Substitution (every state can stand in wherever an OrderState is expected).",
  interviewUses: [
    "Vending machine (idle, has money, dispensing, sold out).",
    "ATM and elevator (moving up, moving down, idle, maintenance).",
    "Order lifecycle and payment status.",
    "Parking ticket (active, paid, lost).",
  ],
  examples: [
    {
      id: "vending",
      domain: "Retail / Kiosks",
      title: "Snack vending machine",
      situation:
        "A vending machine must ignore the select button until money is in, take more coins while it has credit, and refuse coins once it is sold out. The first version was a tangle of flags like has_money and is_empty.",
      roles: [
        { role: "Context", name: "VendingMachine" },
        { role: "State", name: "MachineState" },
        { role: "Concrete state", name: "Idle, HasMoney, SoldOut" },
        { role: "Client", name: "Demo code (button presses)" },
      ],
      why: "Each button means something different in each state. Putting the rules for Idle, HasMoney and SoldOut in separate classes replaces the flags with one current state.",
      goodToKnow:
        "In this classic version the state object changes the context's state itself (m.state = HasMoney()). That is handy, but it couples states to the context's fields; returning the next state, as in the main code, keeps them more independent.",
      walkthrough: [
        "Pressing select while Idle only says \"insert money first\".",
        "Inserting ₹20 moves the machine to HasMoney.",
        "Selecting with ₹20 is refused because the chips cost ₹30.",
        "Another ₹20 brings the credit to ₹40; the next select dispenses the chips with ₹10 change.",
        "That was the last packet, so the machine moves to SoldOut and returns any further coins.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "player",
      domain: "Media",
      title: "Music player play/pause button",
      situation:
        "A music app has one button that starts, pauses and resumes playback, plus a stop button. The button handler kept growing checks for every combination.",
      roles: [
        { role: "Context", name: "MusicPlayer" },
        { role: "State", name: "PlayerState" },
        { role: "Concrete state", name: "Stopped, Playing, Paused" },
        { role: "Client", name: "Demo code (button presses)" },
      ],
      why: "The same press means start, pause or resume depending on the state. Each state class answers the button in its own way, and the shared stop behaviour lives once in the base class.",
      goodToKnow:
        "These states hold no data of their own, so one shared instance of each is enough (case objects in Scala, module-level instances in Python). Keep data such as the track position in the context.",
      walkthrough: [
        "In Stopped, pressing play starts the track from 0:00 and switches to Playing.",
        "In Playing, the same button pauses at 0:42 and switches to Paused.",
        "In Paused, pressing play resumes from 0:42.",
        "Stop uses the default behaviour from the base class: reset the position and go to Stopped.",
        "Pressing stop again only says \"already stopped\", because Stopped overrides it.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "review",
      domain: "Publishing",
      title: "Document review workflow",
      situation:
        "A content team's articles go from draft to review to published. Only the author may submit, an author may not approve their own work, and a reviewer can send it back with a note.",
      roles: [
        { role: "Context", name: "Document" },
        { role: "State", name: "DocState" },
        { role: "Concrete state", name: "Draft, InReview, Published" },
        { role: "Client", name: "Demo code (users acting)" },
      ],
      why: "Who may do what depends on both the state and the user. Each state class owns its own permission rules, so the review rules never leak into the draft rules.",
      goodToKnow:
        "Transitions can go backwards (InReview back to Draft). That is normal; draw the state diagram so loops like this are obvious to the next developer.",
      walkthrough: [
        "Asha submits her travel guide and it moves to InReview.",
        "Asha tries to approve it herself and is refused.",
        "Vikram rejects it with a note, so it goes back to Draft.",
        "Vikram cannot submit Asha's draft, but Asha can, and Vikram then approves it.",
        "A Published document refuses any further rejection.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "payment",
      domain: "Fintech",
      title: "UPI payment status",
      situation:
        "A UPI payment can be created, pending, successful, failed or refunded, and banks send events such as timeouts in any order. The team needs to see every allowed transition at a glance for audits.",
      roles: [
        { role: "Context", name: "UpiPayment" },
        { role: "State", name: "Pay (enum)" },
        { role: "Transitions", name: "TABLE" },
        { role: "Client", name: "Demo code (bank events)" },
      ],
      why: "Payment states carry almost no behaviour of their own, so a table of (state, event) to next state is lighter than a class per state, and the whole lifecycle fits on one screen for reviewers.",
      goodToKnow:
        "Unknown events are ignored here instead of raising, because payment callbacks often arrive late or twice. Decide on purpose whether an invalid event should be ignored, logged or treated as an error.",
      walkthrough: [
        "The payment of ₹1,250 is sent and becomes pending.",
        "A timeout moves it to failed, and the entry action tells the payer to try again.",
        "A refund request is ignored, because a failed payment has nothing to refund.",
        "A retry makes it pending again, and the bank's OK makes it successful and sends a receipt.",
        "A refund then succeeds, and the history shows every step.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
