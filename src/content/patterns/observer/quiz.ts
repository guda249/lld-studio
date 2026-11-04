import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "observer",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What problem does the Observer pattern solve?",
      options: [
        "Letting one object tell any number of others that it changed, without knowing their classes",
        "Saving an object's state so it can be restored later",
        "Making many objects talk through one central object that holds the rules",
        "Choosing an algorithm at runtime from a family of algorithms"
      ],
      answer: 0,
      hint: "Think of the stock ticker: how many classes did it know by name before, and how many after?",
      explain: "Observer lets a subject keep a list of subscribers behind one interface and notify them all, so new listeners need no change to the subject. The other options describe Memento, Mediator and Strategy."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Tap the line that breaks the Observer pattern.",
      code: { lang: "scala", text: `class Order(val id: String):
  private val listeners = ListBuffer.empty[OrderListener]
  def subscribe(l: OrderListener): Unit = listeners += l

  def moveTo(status: String): Unit =
    listeners.foreach(_.onStatus(id, status))
    if status == "PICKED_UP" then RestaurantScreen().show(id)` },
      answer: 7,
      hint: "Which line makes Order depend on one particular listener class again?",
      explain: "Line 7 creates and calls RestaurantScreen directly, so Order is wired to a concrete consumer and must be edited for each new one. The screen should subscribe like everyone else and filter statuses in its own onStatus(). Lines 2, 3 and 6 are exactly how a subject should work."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Python code use?",
      code: { lang: "python", text: `class Thermostat:
    def __init__(self):
        self._listeners = []
        self.celsius = 24.0

    def on_change(self, fn):
        self._listeners.append(fn)

    def set(self, value):
        self.celsius = value
        for fn in self._listeners:
            fn(self)` },
      options: ["Strategy", "Observer", "Mediator", "Command"],
      answer: 1,
      hint: "How many functions can be registered, and when are they called?",
      explain: "Any number of callbacks register with on_change() and all of them are called when the value changes: Observer, with functions as observers. Strategy holds one algorithm, Mediator routes messages between colleagues with rules, and Command wraps a request as an object."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "When a new blog post is published, the site must email followers, update the RSS feed and ping a search index. More channels will be added later by other teams. Which pattern fits best?",
      options: ["Decorator", "Observer", "Builder", "Memento"],
      answer: 1,
      hint: "One event, several independent reactions, and the list keeps growing.",
      explain: "The post publisher is the subject; email, RSS and search are observers that subscribe. A new channel subscribes without touching the publisher. Decorator wraps one object, Builder constructs objects step by step and Memento saves state."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of ticker.set_price(\"INFY\", 1912.00) in the right order.",
      steps: [
        "App subscribes the display and the alert to the ticker",
        "App calls set_price(\"INFY\", 1912.00)",
        "The ticker stores the new price",
        "The ticker loops over its observer list",
        "Each observer's update() reacts in its own way"
      ],
      shuffled: [3, 1, 4, 0, 2],
      hint: "Nobody can be notified before they subscribe, and the price changes before anyone hears about it.",
      explain: "Observers subscribe first. Then a change arrives, the subject updates its own state, loops over its list and calls update() on each observer, which decides what to do."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows the Observer pattern correctly?",
      options: [
        {
          label: "Ticker holds a link to PriceDisplay and to PriceAlert directly.",
          width: 330, height: 200,
          nodes: [
            { id: "t", kind: "concrete", name: "Ticker", key: true, at: { x: 115, y: 20, w: 100 } },
            { id: "d", kind: "concrete", name: "PriceDisplay", at: { x: 8, y: 140, w: 130 } },
            { id: "a", kind: "concrete", name: "PriceAlert", at: { x: 192, y: 140, w: 130 } }
          ],
          edges: [
            { id: "e1", from: "t", to: "d", type: "association" },
            { id: "e2", from: "t", to: "a", type: "association" }
          ]
        },
        {
          label: "PriceDisplay and PriceAlert each hold a link to the Ticker; there is no interface.",
          width: 330, height: 200,
          nodes: [
            { id: "t", kind: "concrete", name: "Ticker", key: true, at: { x: 115, y: 20, w: 100 } },
            { id: "d", kind: "concrete", name: "PriceDisplay", at: { x: 8, y: 140, w: 130 } },
            { id: "a", kind: "concrete", name: "PriceAlert", at: { x: 192, y: 140, w: 130 } }
          ],
          edges: [
            { id: "e1", from: "d", to: "t", type: "association" },
            { id: "e2", from: "a", to: "t", type: "association" }
          ]
        },
        {
          label: "Ticker points to the Observer interface with many multiplicity; PriceDisplay and PriceAlert implement Observer.",
          width: 330, height: 200,
          nodes: [
            { id: "t", kind: "concrete", name: "Ticker", key: true, at: { x: 8, y: 20, w: 100 } },
            { id: "o", kind: "interface", name: "Observer", key: true, at: { x: 180, y: 14, w: 140 } },
            { id: "d", kind: "concrete", name: "PriceDisplay", at: { x: 60, y: 140, w: 130 } },
            { id: "a", kind: "concrete", name: "PriceAlert", at: { x: 200, y: 140, w: 122 } }
          ],
          edges: [
            { id: "e1", from: "t", to: "o", type: "association", toMult: "*" },
            { id: "e2", from: "d", to: "o", type: "realization" },
            { id: "e3", from: "a", to: "o", type: "realization" }
          ]
        }
      ],
      answer: 2,
      hint: "The subject should only know an interface, and it may hold many of them.",
      explain: "C is right: Ticker holds many Observers (the * end) and the concrete classes implement the interface (dashed line, hollow triangle). In A the ticker is hard-wired to each consumer, which is the original problem. In B the consumers poll the ticker and nobody is notified."
    }
  ],
  cards: [
    { id: "ob-intent", front: "Observer: what is its intent, in one line?", back: "When one object changes, automatically tell every object that subscribed, without the subject knowing their classes." },
    { id: "ob-vs-mediator", front: "Observer vs Mediator: what is the difference?", back: "Observer is one-to-many: a subject broadcasts its own changes. Mediator is many-to-many: colleagues send to a hub that holds the rules about who hears what." },
    { id: "ob-solid", front: "Which SOLID principles does Observer mainly apply?", back: "Open/Closed (new observers without editing the subject) and Dependency Inversion (the subject depends only on the Observer interface)." },
    { id: "ob-spot", front: "Which pattern is hiding here?", code: { lang: "scala", text: "button.addActionListener(e => saveDraft())\nbutton.addActionListener(e => logClick())" }, back: "Observer. The button is the subject and each listener is an observer; clicking notifies all of them." },
    { id: "uml-mult", front: "UML: what does a “*” or “0..*” at the end of an association mean?", back: "Multiplicity: the object at the other end can hold any number of these, for example a subject holding many observers." },
    { id: "ob-when-not", front: "When should you NOT use Observer?", back: "When there is only one fixed listener (a direct call is clearer), or when the order of reactions matters a lot, since chains of notifications get hard to follow and debug." }
  ]
};

export default quiz;
