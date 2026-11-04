import type { PatternQuiz } from "../../../anim/types";

/** Ported from the approved prototype (public/prototypes/quiz-flashcards.html). */
const quiz: PatternQuiz = {
  slug: "strategy",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What problem does the Strategy pattern solve?",
      options: [
        "Creating objects without naming their concrete classes",
        "Swapping an algorithm at runtime without changing the code that uses it",
        "Adding behaviour to an object by wrapping it",
        "Notifying many objects when one of them changes"
      ],
      answer: 1,
      hint: "Think of the payment example: what changes between card, UPI and wallet, and what stays the same?",
      explain: "Strategy puts each algorithm behind one interface, so the code that uses it (Checkout) never changes when you swap or add one. The other options describe Factory Method, Decorator and Observer."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Tap the line that stops this from being a proper Strategy.",
      code: { lang: "python", text: `class Checkout:
    def __init__(self):
        self._method = CardPayment()

    def pay(self, amount: float) -> str:
        return self._method.pay(amount)` },
      answer: 3,
      hint: "Which line decides the algorithm, and who should be making that decision?",
      explain: "Line 3 creates CardPayment inside Checkout, so Checkout is locked to one algorithm. Accept a PaymentMethod in the constructor (or a setter) so the client can choose."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `trait Discount:
  def apply(total: BigDecimal): BigDecimal

class FestiveSale extends Discount:
  def apply(total: BigDecimal) = total * 0.9

class Cart(var discount: Discount):
  def checkout(total: BigDecimal) = discount.apply(total)` },
      options: ["Strategy", "State", "Decorator", "Template Method"],
      answer: 0,
      hint: "Who decides which Discount the Cart uses: the Cart itself, or someone outside?",
      explain: "Cart holds a Discount and delegates to it, and any Discount can be plugged in from outside: Strategy. Nothing switches itself (State), nothing wraps another object (Decorator), and there is no fixed skeleton with overridable steps (Template Method)."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "An Order moves from placed to shipped to delivered, and “cancel” behaves differently at each stage. The order itself decides when to move on. Which pattern fits best?",
      options: ["Strategy", "State", "Observer", "Command"],
      answer: 1,
      hint: "Look at who changes the behaviour: the client, or the object itself as it moves through its life?",
      explain: "The behaviour depends on the order's stage, and the order moves itself to the next stage: that's State. With Strategy, the client picks the algorithm from outside."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of checkout.pay(1200) in the right order.",
      steps: [
        "App calls checkout.pay(1200)",
        "Checkout forwards the call to its PaymentMethod",
        "UpiPayment runs its own pay() algorithm",
        "The result travels back to App"
      ],
      shuffled: [2, 0, 3, 1],
      hint: "Start with whoever triggers the call, and finish with whoever receives the answer.",
      explain: "The client calls the context, the context delegates through the interface, the concrete strategy does the work, and the result comes back the same way."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows the Strategy pattern correctly?",
      options: [
        {
          label: "Checkout points to the PaymentMethod interface; CardPayment and UpiPayment implement it.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "concrete", name: "Checkout", key: true, at: { x: 8, y: 20, w: 110 } },
            { id: "i", kind: "interface", name: "PaymentMethod", at: { x: 170, y: 14, w: 150 } },
            { id: "a", kind: "concrete", name: "CardPayment", at: { x: 160, y: 140, w: 110 } },
            { id: "b", kind: "concrete", name: "UPI", at: { x: 278, y: 140, w: 48 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "i", type: "association" },
            { id: "e2", from: "a", to: "i", type: "realization" },
            { id: "e3", from: "b", to: "i", type: "realization" }
          ]
        },
        {
          label: "Checkout points directly to CardPayment; UpiPayment inherits from CardPayment.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "concrete", name: "Checkout", key: true, at: { x: 8, y: 20, w: 110 } },
            { id: "a", kind: "concrete", name: "CardPayment", at: { x: 180, y: 20, w: 130 } },
            { id: "b", kind: "concrete", name: "UpiPayment", at: { x: 180, y: 140, w: 130 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "a", type: "association" },
            { id: "e2", from: "b", to: "a", type: "inheritance" }
          ]
        },
        {
          label: "Checkout owns both CardPayment and UpiPayment through composition.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "concrete", name: "Checkout", key: true, at: { x: 110, y: 20, w: 110 } },
            { id: "a", kind: "concrete", name: "CardPayment", at: { x: 8, y: 140, w: 140 } },
            { id: "b", kind: "concrete", name: "UpiPayment", at: { x: 182, y: 140, w: 140 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "a", type: "composition" },
            { id: "e2", from: "c", to: "b", type: "composition" }
          ]
        }
      ],
      answer: 0,
      hint: "In Strategy, the context should never point at a concrete class.",
      explain: "A is right: Checkout points to the PaymentMethod interface, and the payments implement it (dashed line, hollow triangle). In B, Checkout depends on a concrete class and UPI wrongly inherits from Card. In C, Checkout owns every algorithm, which is the original if/elif problem."
    }
  ],
  cards: [
    { id: "s-intent", front: "Strategy: what is its intent, in one line?", back: "Put interchangeable algorithms behind one interface, so the code that uses them can swap algorithms without changing." },
    { id: "s-vs-state", front: "Strategy vs State: who switches the behaviour?", back: "Strategy: the client, from outside. State: the state objects switch themselves as the object moves through its life." },
    { id: "s-solid", front: "Which SOLID principles does Strategy mainly apply?", back: "Open/Closed (add an algorithm without editing the context) and Dependency Inversion (the context depends on an interface)." },
    { id: "s-spot", front: "Which pattern is hiding in this line?", code: { lang: "python", text: "sorted(products, key=lambda p: p.price)" }, back: "Strategy. The key function is the algorithm, passed in from outside; swap it to sort a different way." },
    { id: "uml-real", front: "UML: what does a dashed line with a hollow triangle mean?", back: "Realization: a class implements an interface (a trait in Scala, an abstract base class or Protocol in Python)." },
    { id: "s-when-not", front: "When should you NOT use Strategy?", back: "When there are only two fixed options that will never grow. A plain if is clearer and has fewer classes." }
  ]
};

export default quiz;
