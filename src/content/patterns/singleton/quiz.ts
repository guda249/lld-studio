import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "singleton",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What does the Singleton pattern guarantee?",
      options: [
        "A class has exactly one instance, and there is one shared way to reach it",
        "Every object is copied from a configured template",
        "A class can be used through an interface it was not written for",
        "An algorithm can be swapped while the program runs"
      ],
      answer: 0,
      hint: "Think of the airport control tower. How many are there, and who talks to it?",
      explain: "Singleton makes the class control its own creation, so only one instance exists and everyone gets that one. Copying from a template is Prototype, using a foreign interface is Adapter, and swapping algorithms is Strategy."
    },
    {
      type: "bug", tag: "Find the problem",
      prompt: "Two threads can still create two Pool objects here. Tap the line that needs a second check before it.",
      code: { lang: "python", text: `import threading

class Pool:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                cls._instance = super().__new__(cls)
        return cls._instance` },
      answer: 10,
      hint: "Two threads can both pass the first if before either one takes the lock. What happens when the second one gets the lock?",
      explain: "Line 10 creates the object without checking again inside the lock. Both threads pass line 8, then each one, in turn, creates a new Pool. Add if cls._instance is None: inside the with block (double-checked locking)."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `object TicketCounter:
  private var next = 0L
  def nextTicket(): Long = synchronized:
    next += 1
    next

@main def demo(): Unit =
  println(TicketCounter.nextTicket())
  println(TicketCounter.nextTicket())` },
      options: ["Prototype", "Singleton", "Flyweight", "Adapter"],
      answer: 1,
      hint: "How many TicketCounter instances can exist, and who creates it?",
      explain: "A Scala object is created once by the language and shared by every caller: Singleton. Nothing is copied (Prototype), there are not many shared instances keyed by value (Flyweight), and no interface is being translated (Adapter)."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "An order service runs on three servers behind a load balancer. Order numbers must be unique across all of them. What should you use?",
      options: [
        "A Singleton OrderNumberGenerator inside each server",
        "A database sequence or a central ID service that all servers share",
        "A Prototype of the generator for each request",
        "A static counter in a utility module"
      ],
      answer: 1,
      hint: "A Singleton is one per what: per class, per process, or per cluster?",
      explain: "A Singleton is one per process, so three servers would have three counters and repeat numbers. A shared database sequence or ID service is one for the whole system. A copied generator or a static counter has the same per-process problem."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of thread-safe AppConfig() (double-checked locking) in order.",
      steps: [
        "Check whether _instance is None, without the lock",
        "Take the lock",
        "Check again whether _instance is None",
        "Create the instance and store it in _instance",
        "Return _instance"
      ],
      shuffled: [3, 0, 4, 2, 1],
      hint: "The cheap check comes first, so most calls never touch the lock.",
      explain: "The first check is the fast path once the object exists. Only then is the lock taken, and the second check makes sure no other thread created it while we waited. Create, store, then return the one instance."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows a Singleton?",
      options: [
        {
          label: "Two clients each own a separate AppConfig object.",
          width: 330, height: 200,
          nodes: [
            { id: "a", kind: "client", name: "Upload", at: { x: 8, y: 20, w: 100 } },
            { id: "b", kind: "client", name: "Download", at: { x: 8, y: 120, w: 100 } },
            { id: "c1", kind: "concrete", name: "c1: AppConfig", at: { x: 180, y: 20, w: 140 } },
            { id: "c2", kind: "concrete", name: "c2: AppConfig", at: { x: 180, y: 126, w: 140 } }
          ],
          edges: [
            { id: "e1", from: "a", to: "c1", type: "composition" },
            { id: "e2", from: "b", to: "c2", type: "composition" }
          ]
        },
        {
          label: "AppConfig is a singleton with a private instance field and a creation method that returns it; Client uses it.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 8, y: 40, w: 96 } },
            { id: "s", kind: "singleton", name: "AppConfig", key: true,
              members: ["- _instance: AppConfig", "+ __new__(): AppConfig", "+ get(key)"], at: { x: 136, y: 20, w: 186 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "s", type: "dependency" }
          ]
        },
        {
          label: "AppConfig has a public constructor; Factory creates many AppConfig objects.",
          width: 330, height: 200,
          nodes: [
            { id: "f", kind: "concrete", name: "Factory", members: ["+ make()"], at: { x: 8, y: 30, w: 110 } },
            { id: "s", kind: "concrete", name: "AppConfig", members: ["+ AppConfig()", "+ get(key)"], at: { x: 170, y: 30, w: 150 } }
          ],
          edges: [
            { id: "e1", from: "f", to: "s", type: "dependency", toMult: "*" }
          ]
        }
      ],
      answer: 1,
      hint: "Look for a class that keeps a reference to its own one instance and controls its own creation.",
      explain: "B is right: AppConfig holds its own private instance and its creation method hands that one back. In A each client owns its own copy, which is the original problem. In C anyone, and a factory, can create as many AppConfig objects as they like."
    }
  ],
  cards: [
    { id: "si-intent", front: "Singleton: what is its intent, in one line?", back: "Make sure a class has exactly one instance, and give one shared way to reach it." },
    { id: "si-vs-static", front: "Singleton vs a static utility module: what is the difference?", back: "A utility module is plain functions with no instance and usually no state. A singleton is a real object with state, and can implement an interface or be passed around." },
    { id: "si-solid", front: "Which SOLID principles does a classic Singleton strain, and how do you fix it?", back: "Single Responsibility (it manages its own lifetime too) and Dependency Inversion (callers grab a concrete global). Create the one instance at startup and inject it." },
    { id: "si-spot", front: "Which pattern is hiding here?", code: { lang: "python", text: "import logging\nlog = logging.getLogger(\"payments\")\nprint(log is logging.getLogger(\"payments\"))  # True" }, back: "A Singleton per name, called a multiton: getLogger returns the same logger object for the same name." },
    { id: "uml-singleton", front: "UML: how do you draw a singleton class?", back: "A class with the «singleton» stereotype, a private static field holding the instance and a static access operation. Static members are underlined, and the constructor is private." },
    { id: "si-when-not", front: "When should you NOT use Singleton?", back: "To avoid passing an argument, when tests need their own instances, or when you need one per cluster: a singleton is only one per process." }
  ]
};

export default quiz;
