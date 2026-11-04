import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "chain-of-responsibility",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What is the main idea of Chain of Responsibility?",
      options: [
        "Pass a request along a line of handlers until one of them deals with it",
        "Wrap an object so every layer adds a little extra behaviour",
        "Let one object tell many listeners that something changed",
        "Pick one algorithm from a family and swap it at runtime"
      ],
      answer: 0,
      hint: "Think of the approval example: who decides which approver finally answers?",
      explain: "Each handler either handles the request or forwards it to its next link, so the sender never needs to know who answers. Wrapping layers that always add behaviour is Decorator, notifying listeners is Observer, and swapping one algorithm is Strategy."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Tap the line that breaks the chain.",
      code: { lang: "python", text: `class Approver:
    def __init__(self, next_approver=None):
        self._next = next_approver

    def approve(self, amount: int) -> str:
        if amount <= self.limit:
            return f"{self.name} approved ₹{amount}"
        return "Rejected"` },
      answer: 8,
      hint: "What should a handler do with a request that is too big for it?",
      explain: "Line 8 rejects the request straight away instead of handing it to self._next. The Manager and Director are never asked, so the chain is only one link long. Forward to the next approver, and reject only when there is no next link."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `abstract class Filter(next: Option[Filter]):
  def blocks(msg: String): Boolean
  def send(msg: String): String =
    if blocks(msg) then s"blocked by \${getClass.getSimpleName}"
    else next.fold("delivered")(_.send(msg))

class SpamFilter(next: Option[Filter]) extends Filter(next):
  def blocks(msg: String) = msg.contains("lottery")` },
      options: ["Decorator", "Chain of Responsibility", "Composite", "Template Method"],
      answer: 1,
      hint: "Can one filter stop the message so that the later filters never see it?",
      explain: "Each Filter holds the next one and may stop the message (blocked) or pass it on: Chain of Responsibility. A Decorator always passes the call on and adds behaviour, Composite is a tree of parts, and although send() is a fixed skeleton, the key idea here is the link to the next handler."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A click on a button may be handled by the button. If the button ignores it, the dialog around it gets a chance, then the whole page. Which pattern describes this?",
      options: ["Observer", "Command", "Chain of Responsibility", "Composite"],
      answer: 2,
      hint: "The click moves from one object to the next until someone takes it.",
      explain: "The event is offered to one handler after another (button, dialog, page) until one handles it: Chain of Responsibility, the idea behind DOM event bubbling. Observer would tell every listener at once, Command wraps the click as an object, and Composite only describes the nesting of the widgets."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of chain.approve(600000) in the right order.",
      steps: [
        "App calls approve(600000) on the first link, TeamLead",
        "TeamLead sees it is over ₹10,000 and forwards it to Manager",
        "Manager sees it is over ₹1,00,000 and forwards it to Director",
        "Director is within its limit and approves it",
        "The answer travels back through Manager and TeamLead to App"
      ],
      shuffled: [3, 0, 4, 2, 1],
      hint: "The request always enters at the first link of the chain.",
      explain: "The client only talks to the first link. Each handler that cannot answer passes the request on, the first one that can answers, and the answer returns along the same calls."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows Chain of Responsibility correctly?",
      options: [
        {
          label: "Client points to the abstract Approver, which holds a next link; TeamLead and Manager extend Approver.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 8, y: 30, w: 80, h: 50 } },
            { id: "a", kind: "abstract", name: "Approver", key: true, members: ["- next: Approver", "+ approve(amt)"], at: { x: 130, y: 8, w: 180 } },
            { id: "t", kind: "concrete", name: "TeamLead", at: { x: 120, y: 145, w: 95 } },
            { id: "m", kind: "concrete", name: "Manager", at: { x: 225, y: 145, w: 95 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "a", type: "association" },
            { id: "e2", from: "t", to: "a", type: "inheritance" },
            { id: "e3", from: "m", to: "a", type: "inheritance" }
          ]
        },
        {
          label: "ApprovalDesk owns TeamLead, Manager and Director by composition and picks one itself.",
          width: 330, height: 200,
          nodes: [
            { id: "d", kind: "concrete", name: "ApprovalDesk", key: true, members: ["+ route(amt)"], at: { x: 95, y: 14, w: 140 } },
            { id: "t", kind: "concrete", name: "TeamLead", at: { x: 8, y: 145, w: 98 } },
            { id: "m", kind: "concrete", name: "Manager", at: { x: 116, y: 145, w: 98 } },
            { id: "r", kind: "concrete", name: "Director", at: { x: 224, y: 145, w: 98 } }
          ],
          edges: [
            { id: "e1", from: "d", to: "t", type: "composition" },
            { id: "e2", from: "d", to: "m", type: "composition" },
            { id: "e3", from: "d", to: "r", type: "composition" }
          ]
        },
        {
          label: "TeamLead inherits from Manager, which inherits from Director.",
          width: 330, height: 200,
          nodes: [
            { id: "r", kind: "concrete", name: "Director", key: true, at: { x: 222, y: 10, w: 100 } },
            { id: "m", kind: "concrete", name: "Manager", at: { x: 115, y: 80, w: 100 } },
            { id: "t", kind: "concrete", name: "TeamLead", at: { x: 8, y: 150, w: 100 } }
          ],
          edges: [
            { id: "e1", from: "t", to: "m", type: "inheritance", route: "straight" },
            { id: "e2", from: "m", to: "r", type: "inheritance", route: "straight" }
          ]
        }
      ],
      answer: 0,
      hint: "Look for a link from a handler to the next handler, and a client that knows only the base type.",
      explain: "A is right: every approver extends Approver, which keeps a next link, and the client depends only on Approver. B is the old if/elif desk that knows every approver and decides itself. C uses inheritance, which fixes the order at compile time and is not a chain of objects at all."
    }
  ],
  cards: [
    { id: "cr-intent", front: "Chain of Responsibility: what is its intent, in one line?", back: "Pass a request along a chain of handler objects; each one handles it or forwards it, so the sender never knows who answers." },
    { id: "cr-vs-decorator", front: "Chain of Responsibility vs Decorator: what is the difference?", back: "Both link objects one after another. A Decorator always calls the next one and adds behaviour. A chain handler may stop the request and answer itself." },
    { id: "cr-solid", front: "Which SOLID principles does Chain of Responsibility apply?", back: "Single Responsibility (one rule per handler) and Open/Closed (a new handler is a new class plus one change where the chain is built)." },
    { id: "cr-spot", front: "Which pattern is hiding in this code?", code: { lang: "python", text: `def handle(req, handlers):
    for h in handlers:
        answer = h(req)
        if answer is not None:
            return answer
    return "unhandled"` }, back: "Chain of Responsibility, written as a list of functions. Each one returns None to say \"not mine\"; the first real answer wins." },
    { id: "cr-uml", front: "UML: how do you draw the \"next\" link of a handler?", back: "A solid association arrow from the Handler class to itself (or between handler objects), labelled next, multiplicity 0..1." },
    { id: "cr-when-not", front: "When should you NOT use Chain of Responsibility?", back: "When every request always goes to one obvious handler, or when you must easily trace who did the work. A direct call is simpler." }
  ]
};

export default quiz;
