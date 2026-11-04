import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "state",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What problem does the State pattern solve?",
      options: [
        "Choosing an algorithm from outside and swapping it at runtime",
        "Letting an object change its behaviour when its internal state changes, without if/elif in every method",
        "Saving an object's state so it can be restored later",
        "Making sure a class has only one instance"
      ],
      answer: 1,
      hint: "Think of the order: the same cancel() call works when placed and is refused when shipped.",
      explain: "State moves each state's rules into its own class and lets the object delegate to its current state, so the same call behaves differently as the object moves through its life. The others describe Strategy (chosen from outside), Memento (save and restore) and Singleton."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Tap the line that undoes the point of the State pattern.",
      code: { lang: "python", text: `class Order:
    def __init__(self) -> None:
        self._state: OrderState = Placed()

    def ship(self) -> None:
        if isinstance(self._state, Placed):
            self._state = self._state.ship()` },
      answer: 6,
      hint: "Who should decide whether ship() is allowed: Order, or the current state object?",
      explain: "Line 6 checks the state's type inside the context, which brings the if/elif back: every new state would mean editing Order again. Order should simply call self._state.ship() and let the state refuse or allow it."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `sealed trait Light:
  def next: Light

case object Red extends Light:
  def next = Green
case object Green extends Light:
  def next = Amber
case object Amber extends Light:
  def next = Red

class Signal:
  private var light: Light = Red
  def tick(): Unit = light = light.next` },
      options: ["Strategy", "State", "Command", "Memento"],
      answer: 1,
      hint: "Who decides which Light comes next: the Signal's user, or the light objects themselves?",
      explain: "Signal delegates to its current Light, and each light decides the next one: that is State. With Strategy the client picks the object from outside and strategies do not know each other; Command wraps one request; Memento stores a snapshot."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A UPI payment has five statuses. They carry no logic of their own, only which event leads where, and auditors want to see every allowed transition on one screen. What is the best fit?",
      options: [
        "One State class per status, each overriding its events",
        "An enum of states and a (state, event) → next state table",
        "Observer, so each status can listen to bank events",
        "A Singleton that holds the current status"
      ],
      answer: 1,
      hint: "When states have no behaviour, do they need to be classes at all?",
      explain: "With no behaviour per state, a transition table is lighter than a class per state, and the whole lifecycle fits on one screen. State classes pay off when each state carries real logic. Observer and Singleton do not model transitions at all."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of order.ship() in the right order (the order is placed).",
      steps: [
        "App calls order.ship()",
        "Order forwards the call to its current state, Placed",
        "Placed.ship() returns a new Shipped state",
        "Order stores Shipped as its current state",
        "The next call, such as deliver(), now goes to Shipped"
      ],
      shuffled: [3, 0, 4, 2, 1],
      hint: "The state decides the next state, but who keeps it?",
      explain: "The client calls the context, the context delegates to its current state, the state returns the next state, and the context stores it so that later calls reach the new state."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows the State pattern correctly?",
      options: [
        {
          label: "Order points to the abstract OrderState; Placed and Shipped extend it.",
          width: 330, height: 200,
          nodes: [
            { id: "o", kind: "concrete", name: "Order", key: true, at: { x: 8, y: 20, w: 100 } },
            { id: "s", kind: "abstract", name: "OrderState", at: { x: 170, y: 14, w: 150 } },
            { id: "a", kind: "concrete", name: "Placed", at: { x: 160, y: 140, w: 76 } },
            { id: "b", kind: "concrete", name: "Shipped", at: { x: 246, y: 140, w: 76 } }
          ],
          edges: [
            { id: "e1", from: "o", to: "s", type: "association" },
            { id: "e2", from: "a", to: "s", type: "inheritance" },
            { id: "e3", from: "b", to: "s", type: "inheritance" }
          ]
        },
        {
          label: "Placed and Shipped are subclasses of Order.",
          width: 330, height: 200,
          nodes: [
            { id: "o", kind: "concrete", name: "Order", key: true, at: { x: 115, y: 20, w: 100 } },
            { id: "a", kind: "concrete", name: "Placed", at: { x: 30, y: 140, w: 110 } },
            { id: "b", kind: "concrete", name: "Shipped", at: { x: 190, y: 140, w: 110 } }
          ],
          edges: [
            { id: "e1", from: "a", to: "o", type: "inheritance" },
            { id: "e2", from: "b", to: "o", type: "inheritance" }
          ]
        },
        {
          label: "Order owns a Placed and a Shipped object through composition, with no shared type.",
          width: 330, height: 200,
          nodes: [
            { id: "o", kind: "concrete", name: "Order", key: true, at: { x: 115, y: 20, w: 100 } },
            { id: "a", kind: "concrete", name: "Placed", at: { x: 30, y: 140, w: 110 } },
            { id: "b", kind: "concrete", name: "Shipped", at: { x: 190, y: 140, w: 110 } }
          ],
          edges: [
            { id: "e1", from: "o", to: "a", type: "composition" },
            { id: "e2", from: "o", to: "b", type: "composition" }
          ]
        }
      ],
      answer: 0,
      hint: "The context should hold one reference whose type covers every state.",
      explain: "A is right: Order holds one OrderState, and each state extends it, so the current state can be swapped for any other. In B an order would have to change its class to change state, which objects cannot do. In C Order knows every concrete state and must pick between them with if/elif again."
    }
  ],
  cards: [
    { id: "st-intent", front: "State: what is its intent, in one line?", back: "Let an object change its behaviour when its internal state changes, by delegating to one object per state. It looks as if the object changed its class." },
    { id: "st-vs-strategy", front: "State vs Strategy: they have the same class diagram. What is the difference?", back: "Strategy: the client picks the algorithm from outside, and strategies do not know each other. State: the states switch themselves and know which state comes next." },
    { id: "st-solid", front: "Which SOLID principles does State mainly apply?", back: "Single Responsibility (one class per state's rules), Open/Closed (add a state without editing the others or the context) and Liskov Substitution (any state stands in for the base)." },
    { id: "st-spot", front: "Which pattern is hiding here?", code: { lang: "python", text: `def press_play(self) -> None:
    self._state.press_play(self)   # Stopped starts, Playing pauses, Paused resumes` }, back: "State. The same button is handed to the current state object, which decides what it means and switches the player to the next state." },
    { id: "uml-inherit", front: "UML: what does a solid line with a hollow triangle mean?", back: "Inheritance (generalisation): the class at the plain end extends the class at the triangle, for example Placed extends OrderState." },
    { id: "st-when-not", front: "When should you NOT use State?", back: "When there are only two or three states with trivial behaviour (an enum and an if is clearer), or when transitions are plain data (use a transition table)." }
  ]
};

export default quiz;
