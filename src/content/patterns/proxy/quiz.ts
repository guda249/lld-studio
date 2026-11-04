import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "proxy",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What does the Proxy pattern do?",
      options: [
        "Gives a class a different interface so old code can use it",
        "Stands in for another object with the same interface and controls access to it",
        "Hides a group of classes behind one simpler interface",
        "Lets the client stack extra features on an object at runtime"
      ],
      answer: 1,
      hint: "Think of the document store: did the client's code change when the proxy appeared?",
      explain: "A proxy has exactly the same interface as the real object, so clients cannot tell them apart, and it controls access: checks, lazy creation, caching or remote calls. A new interface is Adapter, a simpler front for many classes is Facade, and features the client stacks itself is Decorator."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "This proxy is meant to load the heavy report only when it is first rendered. Tap the line that breaks that.",
      code: { lang: "scala", text: `trait Report:
  def render(): String

class HeavyReport extends Report:
  println("Loading 2 GB of sales data...")
  def render(): String = "Q3 sales report"

class LazyReportProxy extends Report:
  private val real = HeavyReport()
  def render(): String = real.render()` },
      answer: 9,
      hint: "When does a plain val run its right-hand side: at construction, or at first use?",
      explain: "Line 9 is a plain val, so HeavyReport is created as soon as the proxy is created, and the 2 GB load happens even if nobody renders. Make it a lazy val (or an Option filled in render) so the real object is created on first use."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Python code use?",
      code: { lang: "python", text: `class SecureFolder(Folder):
    def __init__(self, user: User) -> None:
        self._user = user
        self._folder: DiskFolder | None = None

    def open(self) -> list[str]:
        if not self._user.is_admin:
            raise PermissionError("admins only")
        if self._folder is None:
            self._folder = DiskFolder("/payroll")
        return self._folder.open()` },
      options: ["Decorator", "Adapter", "Proxy", "Facade"],
      answer: 2,
      hint: "Who creates the DiskFolder, and does SecureFolder add a feature or guard the way in?",
      explain: "SecureFolder has the same open() as Folder, checks access, and creates the real DiskFolder itself on first use: a protection and virtual proxy. A decorator is handed an object to wrap and adds behaviour, an adapter changes the interface, and a facade simplifies several classes."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "Thirty places in an app call a slow currency-rate service that bills per call. Rates change only every few minutes. You want fewer calls without editing those thirty callers. What fits best?",
      options: [
        "An Adapter that converts the service's API",
        "A caching Proxy with the same interface as the service",
        "An Observer that tells callers when rates change",
        "A Facade that merges the rate service with other services"
      ],
      answer: 1,
      hint: "The callers must not change, so whatever you add has to look exactly like the service.",
      explain: "A caching proxy implements the same interface, answers repeat questions from memory for a short TTL and calls the real service only on a miss, so the thirty callers stay as they are. An adapter or facade would give them a different interface, and Observer does not reduce calls."
    },
    {
      type: "order", tag: "Put in order", prompt: "An editor reads a document for the first time through DocumentStoreProxy. Put the steps in order.",
      steps: [
        "The client calls read(\"contract-42\") on the proxy",
        "The proxy checks that the role is allowed",
        "The proxy creates RealDocumentStore, because it does not exist yet",
        "The proxy forwards read() to the real store",
        "The contents travel back to the client"
      ],
      shuffled: [2, 4, 0, 3, 1],
      hint: "Check first, create second: a guest should never cause a connection.",
      explain: "The client makes a normal call. The proxy checks access before doing anything costly, creates the real store only on this first allowed read, forwards the call, and the result goes back the same way."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows the Proxy pattern correctly?",
      options: [
        {
          label: "StoreProxy and RealStore both implement the Store interface; StoreProxy holds a RealStore.",
          width: 330, height: 200,
          nodes: [
            { id: "i", kind: "interface", name: "Store", at: { x: 100, y: 12, w: 130 } },
            { id: "p", kind: "concrete", name: "StoreProxy", key: true, at: { x: 8, y: 140, w: 120 } },
            { id: "r", kind: "concrete", name: "RealStore", at: { x: 202, y: 140, w: 120 } }
          ],
          edges: [
            { id: "e1", from: "p", to: "i", type: "realization" },
            { id: "e2", from: "r", to: "i", type: "realization" },
            { id: "e3", from: "p", to: "r", type: "association" }
          ]
        },
        {
          label: "StoreProxy implements Store and holds a RealStore, but RealStore does not implement Store.",
          width: 330, height: 200,
          nodes: [
            { id: "i", kind: "interface", name: "Store", at: { x: 8, y: 12, w: 130 } },
            { id: "p", kind: "concrete", name: "StoreProxy", key: true, at: { x: 13, y: 140, w: 120 } },
            { id: "r", kind: "concrete", name: "RealStore", at: { x: 202, y: 140, w: 120 } }
          ],
          edges: [
            { id: "e1", from: "p", to: "i", type: "realization" },
            { id: "e3", from: "p", to: "r", type: "association" }
          ]
        },
        {
          label: "RealStore implements Store and points to StoreProxy, which implements nothing.",
          width: 330, height: 200,
          nodes: [
            { id: "i", kind: "interface", name: "Store", at: { x: 192, y: 12, w: 130 } },
            { id: "p", kind: "concrete", name: "StoreProxy", key: true, at: { x: 8, y: 140, w: 120 } },
            { id: "r", kind: "concrete", name: "RealStore", at: { x: 202, y: 140, w: 120 } }
          ],
          edges: [
            { id: "e2", from: "r", to: "i", type: "realization" },
            { id: "e3", from: "r", to: "p", type: "association" }
          ]
        }
      ],
      answer: 0,
      hint: "The client must be able to use either the proxy or the real object through one interface.",
      explain: "A is right: both classes implement Store (dashed line, hollow triangle) and the proxy holds the real store. In B, RealStore does not implement Store, so the two are not interchangeable. In C, the real object points at the proxy and the proxy has no shared interface, so clients cannot treat it as a Store."
    }
  ],
  cards: [
    { id: "px-intent", front: "Proxy: what is its intent, in one line?", back: "Put a stand-in with the same interface in front of a real object, to control access to it: check, delay, cache or send it elsewhere." },
    { id: "px-vs-decorator", front: "Proxy vs Decorator: both wrap an object with the same interface. What is the difference?", back: "A decorator adds features, and the client builds and stacks decorators itself. A proxy controls access to one real object and usually creates and owns it." },
    { id: "px-solid", front: "Which SOLID principles does Proxy mainly apply?", back: "Single Responsibility (access rules and lazy loading stay out of the real class), Open/Closed (new controls without editing it) and Liskov Substitution (the proxy works wherever the interface is expected)." },
    { id: "px-spot", front: "Which pattern is built into this Scala keyword?", code: { lang: "scala", text: "lazy val catalogue = loadCatalogue() // runs on first use" }, back: "A virtual proxy for one value: nothing is computed until the first use, then the result is reused. Python's functools.cached_property does the same." },
    { id: "uml-assoc", front: "UML: what does a solid line with an open arrowhead from StoreProxy to RealStore mean?", back: "Association: StoreProxy holds a reference to RealStore and can call it. The arrow shows which side knows about the other." },
    { id: "px-when-not", front: "When should you NOT use Proxy?", back: "When the real object is cheap and has no access rules: the proxy is pure overhead. Also be careful when a remote proxy hides slow or failing network calls behind a local-looking method." }
  ]
};

export default quiz;
