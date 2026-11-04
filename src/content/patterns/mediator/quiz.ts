import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "mediator",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What problem does the Mediator pattern solve?",
      options: [
        "Saving an object's state so it can be restored later",
        "Many objects talking to each other directly, so every class knows every other class",
        "One object notifying a list of subscribers when it changes",
        "Giving a large subsystem one simple entry point for outsiders"
      ],
      answer: 1,
      hint: "Think of the chat users: how many links did each user hold before the ChatRoom existed?",
      explain: "Mediator replaces a many-to-many web of links with many-to-one: every colleague talks only to the mediator, which holds the interaction rules. The other options describe Memento, Observer and Facade."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Tap the line that breaks the Mediator pattern.",
      code: { lang: "python", text: `class Plane:
    def __init__(self, call_sign, tower):
        self.call_sign = call_sign
        self.tower = tower

    def request_landing(self, others):
        for plane in others:
            plane.receive(f"{self.call_sign} is landing")
        self.tower.request_landing(self)` },
      answer: 8,
      hint: "Which line lets a colleague talk to another colleague directly?",
      explain: "Line 8 makes one plane call receive() on other planes, so planes know each other again. Only the tower should decide who is told what. The tower reference (line 4) and the call to the tower (line 9) are exactly what Mediator wants."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `class Lobby:
  private val players = mutable.Map.empty[String, Player]
  def join(p: Player): Unit = players(p.name) = p
  def invite(from: String, to: String): Unit =
    players.get(to).foreach(_.notify(s"$from invited you"))

class Player(val name: String, lobby: Lobby):
  def invite(friend: String): Unit = lobby.invite(name, friend)
  def notify(msg: String): Unit = println(s"$name: $msg")` },
      options: ["Observer", "Facade", "Mediator", "Chain of Responsibility"],
      answer: 2,
      hint: "Does a Player ever hold a reference to another Player?",
      explain: "Players only know the Lobby, and the Lobby decides who receives each invite: Mediator. It is not Observer (no subject with a subscriber list broadcasting its own changes), not Facade (players know the lobby and call it as peers), and not a chain (no handler passes the request along)."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "In a booking dialog, choosing “One way” must hide the return-date picker, and the Search button works only when both cities are filled. The widgets should stay reusable on other pages. Which pattern fits best?",
      options: ["Mediator", "Strategy", "Decorator", "Memento"],
      answer: 0,
      hint: "Several widgets affect each other. Where should the “if this changes, update that” rules live?",
      explain: "A dialog controller that receives “I changed” from each widget and updates the others is the classic Mediator. Strategy swaps one algorithm, Decorator wraps one object to add behaviour, and Memento saves and restores state."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of ravi.say(\"Lunch at 1?\") in the right order.",
      steps: [
        "ravi calls say(\"Lunch at 1?\") on himself",
        "ravi hands the message to his room: send(\"ravi\", text, None)",
        "ChatRoom picks every member except the sender",
        "ChatRoom skips asha because she muted ravi",
        "meera's receive() adds the message to her inbox"
      ],
      shuffled: [3, 0, 4, 2, 1],
      hint: "The sender only talks to the room; the room does all the deciding before anyone receives anything.",
      explain: "The colleague passes the message to the mediator, the mediator chooses the targets and applies the mute rule, and only then are messages delivered. ravi never calls meera or asha himself."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows the Mediator pattern correctly?",
      options: [
        {
          label: "Each User points directly to the other Users.",
          width: 330, height: 200,
          nodes: [
            { id: "a", kind: "concrete", name: "UserA", at: { x: 20, y: 20, w: 100 } },
            { id: "b", kind: "concrete", name: "UserB", at: { x: 210, y: 20, w: 100 } },
            { id: "c", kind: "concrete", name: "UserC", at: { x: 115, y: 140, w: 100 } }
          ],
          edges: [
            { id: "e1", from: "a", to: "b", type: "association" },
            { id: "e2", from: "b", to: "c", type: "association", route: "straight" },
            { id: "e3", from: "c", to: "a", type: "association", route: "straight" }
          ]
        },
        {
          label: "Member points to the ChatMediator interface; ChatRoom implements it and holds the members.",
          width: 330, height: 200,
          nodes: [
            { id: "m", kind: "concrete", name: "Member", at: { x: 8, y: 20, w: 100 } },
            { id: "i", kind: "interface", name: "ChatMediator", key: true, at: { x: 170, y: 14, w: 150 } },
            { id: "r", kind: "concrete", name: "ChatRoom", key: true, at: { x: 170, y: 136, w: 150 } }
          ],
          edges: [
            { id: "e1", from: "m", to: "i", type: "association" },
            { id: "e2", from: "r", to: "i", type: "realization" },
            { id: "e3", from: "r", to: "m", type: "aggregation", toMult: "*", via: [[58, 160]] }
          ]
        },
        {
          label: "ChatRoom inherits from Member, and Member inherits from User.",
          width: 330, height: 200,
          nodes: [
            { id: "u", kind: "concrete", name: "User", at: { x: 110, y: 14, w: 110 } },
            { id: "m", kind: "concrete", name: "Member", at: { x: 20, y: 140, w: 110 } },
            { id: "r", kind: "concrete", name: "ChatRoom", at: { x: 200, y: 140, w: 110 } }
          ],
          edges: [
            { id: "e1", from: "m", to: "u", type: "inheritance" },
            { id: "e2", from: "r", to: "m", type: "inheritance" }
          ]
        }
      ],
      answer: 1,
      hint: "In Mediator, colleagues should have exactly one link: to the mediator.",
      explain: "B is right: Member knows only the ChatMediator interface, ChatRoom implements it (dashed line, hollow triangle) and holds the members. A is the original tangle of direct links. C uses inheritance, which shares code but does not route any messages."
    }
  ],
  cards: [
    { id: "md-intent", front: "Mediator: what is its intent, in one line?", back: "Make objects talk through one middle object instead of to each other, so the interaction rules live in one place." },
    { id: "md-vs-observer", front: "Mediator vs Observer: what is the difference?", back: "Observer: one subject tells its subscribers that it changed. Mediator: many colleagues send to one hub, which decides who hears what. A mediator is often built using observers." },
    { id: "md-solid", front: "Which SOLID principles does Mediator mainly apply?", back: "Single Responsibility (interaction rules in one class) and Open/Closed (a new colleague joins without editing the others). Colleagues depend on the mediator interface (Dependency Inversion)." },
    { id: "md-spot", front: "Which pattern is hiding here?", code: { lang: "python", text: "bus.subscribe(\"order.paid\", send_invoice)\nbus.publish(\"order.paid\", order)" }, back: "Mediator, in its event-bus form. Sender and listener share only a topic name; the bus decides who is called." },
    { id: "uml-assoc", front: "UML: what does a solid line with an open arrowhead mean?", back: "Association (navigable): the class at the tail holds a reference to the class at the arrow, like Member → ChatMediator." },
    { id: "md-when-not", front: "When should you NOT use Mediator?", back: "When only two or three objects interact in a simple, stable way, or when the mediator would swallow all the business logic and become a god object." }
  ]
};

export default quiz;
