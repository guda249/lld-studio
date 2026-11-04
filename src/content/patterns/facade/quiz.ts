import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "facade",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What is the main job of a Facade?",
      options: [
        "Convert one existing interface into another one that a client expects",
        "Give clients one simple entry point to a group of classes, while those classes stay usable on their own",
        "Control access to one object, for example by loading it lazily",
        "Let subsystem objects talk to each other through one central object"
      ],
      answer: 1,
      hint: "Think of the OrderFacade: how many services did the controller talk to before, and how many after?",
      explain: "A facade puts a simpler door in front of many classes and does the coordination inside. Converting one interface is Adapter, guarding one object is Proxy, and objects talking through a hub that they know about is Mediator."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "This facade has started doing work that is not its job. Tap the line that should live somewhere else.",
      code: { lang: "python", text: `class OrderFacade:
    def __init__(self, inventory, payments, shipping):
        self._inventory = inventory
        self._payments = payments
        self._shipping = shipping

    def place_order(self, user, sku, amount):
        if not self._inventory.reserve(sku, 1):
            return "Out of stock"
        gst = round(amount * 0.18, 2)
        ref = self._payments.charge(user, amount + gst)
        return self._shipping.schedule(user, sku)` },
      answer: 10,
      hint: "A facade coordinates. Which line is a business rule rather than a call to a service?",
      explain: "Line 10 works out GST inside the facade. Tax rules belong in the subsystem (for example a TaxService or the PaymentService). If the facade keeps collecting rules like this it grows into a god object. The other lines only store services or call them in order, which is the facade's real job."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `class Cpu:
  def start(): String = "cpu ok"
class Memory:
  def load(at: Int): String = s"loaded at $at"
class Disk:
  def read(sector: Int): String = s"sector $sector"

class Computer(cpu: Cpu, mem: Memory, disk: Disk):
  def boot(): List[String] =
    List(cpu.start(), mem.load(0), disk.read(42))` },
      options: ["Adapter", "Facade", "Composite", "Proxy"],
      answer: 1,
      hint: "How many classes sit behind Computer, and what does boot() do with them?",
      explain: "Computer gives one simple method, boot(), that calls three different classes in a fixed order: Facade. An Adapter wraps one object to change its interface, a Composite treats a tree of same-type parts as one, and a Proxy stands in for one object with the same interface."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "Your app uploads videos with a cloud SDK. Every screen repeats: create a multipart upload, send 5 MB chunks, retry failed chunks, then complete the upload. What should you do?",
      options: [
        "Write a VideoUploader facade with one upload(path) method that does the steps inside",
        "Wrap the SDK client in a Proxy that has the same methods as the SDK",
        "Make every screen subclass the SDK client",
        "Copy the steps into a shared utility comment so nobody forgets"
      ],
      answer: 0,
      hint: "The screens want one action. Many SDK calls in a fixed order sit behind it.",
      explain: "A facade gives the screens one call and keeps the order and the retries in one place. A proxy keeps the same wide SDK interface, so screens still do every step. Subclassing the SDK ties screens to vendor details, and a comment does not stop copies from drifting."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of shop.place_order(\"asha\", \"BOOK-1\", 1, 399) in the right order.",
      steps: [
        "The controller calls place_order on the facade",
        "The facade asks Inventory to reserve the book",
        "The facade asks PaymentService to charge ₹399",
        "The facade asks ShippingService for a tracking number",
        "The facade sends a confirmation through Notifier and returns one summary"
      ],
      shuffled: [3, 0, 4, 2, 1],
      hint: "No stock means no charge, and you cannot send a tracking number before you have one.",
      explain: "The client makes one call, then the facade runs the flow: reserve first (so nobody pays for missing stock), charge, schedule shipping, and only then notify with the tracking number and return one answer."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows a Facade correctly?",
      options: [
        {
          label: "Inventory and PaymentService both point back to OrderFacade, and the client points to OrderFacade.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 8, y: 20, w: 80, h: 44 } },
            { id: "f", kind: "concrete", name: "OrderFacade", key: true, at: { x: 120, y: 16, w: 130 } },
            { id: "a", kind: "concrete", name: "Inventory", at: { x: 40, y: 140, w: 110 } },
            { id: "b", kind: "concrete", name: "PaymentService", at: { x: 170, y: 140, w: 140 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "f", type: "association" },
            { id: "e2", from: "a", to: "f", type: "association" },
            { id: "e3", from: "b", to: "f", type: "association" }
          ]
        },
        {
          label: "The client points to OrderFacade, which points to Inventory and PaymentService.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 8, y: 20, w: 80, h: 44 } },
            { id: "f", kind: "concrete", name: "OrderFacade", key: true, at: { x: 120, y: 16, w: 130 } },
            { id: "a", kind: "concrete", name: "Inventory", at: { x: 40, y: 140, w: 110 } },
            { id: "b", kind: "concrete", name: "PaymentService", at: { x: 170, y: 140, w: 140 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "f", type: "association" },
            { id: "e2", from: "f", to: "a", type: "association" },
            { id: "e3", from: "f", to: "b", type: "association" }
          ]
        },
        {
          label: "Inventory and PaymentService inherit from OrderFacade.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 8, y: 20, w: 80, h: 44 } },
            { id: "f", kind: "concrete", name: "OrderFacade", key: true, at: { x: 120, y: 16, w: 130 } },
            { id: "a", kind: "concrete", name: "Inventory", at: { x: 40, y: 140, w: 110 } },
            { id: "b", kind: "concrete", name: "PaymentService", at: { x: 170, y: 140, w: 140 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "f", type: "association" },
            { id: "e2", from: "a", to: "f", type: "inheritance" },
            { id: "e3", from: "b", to: "f", type: "inheritance" }
          ]
        }
      ],
      answer: 1,
      hint: "Which side knows about the other: does the facade know the services, or do the services know the facade?",
      explain: "B is right: the facade holds references to the services, and the services know nothing about it. In A the arrows point the wrong way, so the services depend on the facade (that is closer to Mediator). In C the services inherit from the facade, but a facade uses its subsystem, it is not their parent."
    }
  ],
  cards: [
    { id: "f-intent", front: "Facade: what is its intent, in one line?", back: "Give clients one simple entry point to a complex group of classes, and keep the coordination of those classes in one place." },
    { id: "f-vs-mediator", front: "Facade vs Mediator: who knows about whom?", back: "Facade: only clients know it; the subsystem classes have no idea it exists. Mediator: the colleague objects know the mediator and talk to each other through it." },
    { id: "f-solid", front: "Which SOLID principles does Facade mainly help with?", back: "Single Responsibility (clients stop orchestrating the flow) and Interface Segregation (clients see a small surface). Inject the facade as an interface and you get Dependency Inversion too." },
    { id: "f-spot", front: "Which pattern is hiding in this call?", code: { lang: "python", text: "requests.get(\"https://api.example.com/users\", timeout=5)" }, back: "Facade. One function hides sessions, connection pools, encoding, redirects and retries; the lower-level pieces are still there if you need them." },
    { id: "uml-assoc", front: "UML: what does a solid line with an open arrowhead from OrderFacade to Inventory mean?", back: "Association: OrderFacade holds a reference to Inventory and can call it. The arrow shows the direction: Inventory does not know OrderFacade." },
    { id: "f-when-not", front: "When should you NOT use a Facade?", back: "When only one simple class sits behind it (it just adds a layer), or when the facade starts to hold business rules and turns into a god object." }
  ]
};

export default quiz;
