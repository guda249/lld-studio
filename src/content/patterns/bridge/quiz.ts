import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "bridge",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What problem does the Bridge pattern solve?",
      options: [
        "Making an old class fit an interface it was not written for",
        "Stopping a class hierarchy from multiplying when two independent things vary",
        "Treating a single object and a group of objects the same way",
        "Adding features to one object at runtime by wrapping it"
      ],
      answer: 1,
      hint: "Think of reports and formats: what happens to the number of classes when both keep growing?",
      explain: "Bridge splits two dimensions (what the report says, how it is rendered) into two hierarchies joined by one reference, so you write M + N classes instead of M × N. The other options describe Adapter, Composite and Decorator."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Tap the line that breaks the bridge.",
      code: { lang: "python", text: `class Report(ABC):
    def __init__(self, renderer: Renderer) -> None:
        self._renderer = renderer

class SalesReport(Report):
    def generate(self) -> str:
        return CsvRenderer().render("Sales", SALES)` },
      answer: 7,
      hint: "SalesReport was given a renderer. Does it use it?",
      explain: "Line 7 creates a CsvRenderer itself and ignores self._renderer, so SalesReport is welded to CSV again. It should call self._renderer.render(...) so whoever builds the report chooses the format."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `trait Device:
  def setVolume(v: Int): String

class Tv extends Device:
  def setVolume(v: Int) = s"TV volume $v"
class Radio extends Device:
  def setVolume(v: Int) = s"Radio volume $v"

abstract class Remote(val device: Device):
  def louder(): String
class BasicRemote(d: Device) extends Remote(d):
  def louder() = device.setVolume(60)
class SmartRemote(d: Device) extends Remote(d):
  def louder() = device.setVolume(45)` },
      options: ["Adapter", "Bridge", "Strategy", "Decorator"],
      answer: 1,
      hint: "Count the hierarchies. Can both sides grow on their own?",
      explain: "Remotes and devices are two hierarchies that both grow, joined by the device field: Bridge. Adapter would convert one existing interface to another; Strategy has one context, not a family of remotes; Decorator would wrap an object of the same type."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A drawing app has shapes (Circle, Square, Arrow) and must draw them with two graphics back-ends, with more shapes and a third back-end planned. Which pattern fits best?",
      options: ["Composite", "Adapter", "Bridge", "Template Method"],
      answer: 2,
      hint: "Two lists keep growing independently. How do you avoid a CircleOpenGL, CircleVector, SquareOpenGL… explosion?",
      explain: "Shapes and back-ends vary independently, so give each shape a reference to a Renderer back-end: Bridge. Composite groups shapes into trees, Adapter fixes one mismatched interface, and Template Method fixes the steps of one algorithm."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of InventoryReport(CsvRenderer()).generate() in the right order.",
      steps: [
        "App builds an InventoryReport and hands it a CsvRenderer",
        "App calls generate() on the report",
        "InventoryReport picks the title and rows",
        "It calls render() on the renderer it holds",
        "CsvRenderer formats the lines and returns the text"
      ],
      shuffled: [3, 0, 4, 2, 1],
      hint: "The object must exist before anything is called on it, and the format is applied last.",
      explain: "First the pair is chosen when the report is built. Then generate() runs: the report decides what to show, crosses the bridge with render(), and the renderer decides how it looks."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows the Bridge pattern correctly?",
      options: [
        {
          label: "Report points to the Renderer interface; SalesReport extends Report; CsvRenderer implements Renderer.",
          width: 330, height: 200,
          nodes: [
            { id: "a", kind: "abstract", name: "Report", key: true, at: { x: 8, y: 14, w: 120 } },
            { id: "i", kind: "interface", name: "Renderer", key: true, at: { x: 196, y: 14, w: 126 } },
            { id: "s", kind: "concrete", name: "SalesReport", at: { x: 8, y: 140, w: 120 } },
            { id: "c", kind: "concrete", name: "CsvRenderer", at: { x: 196, y: 140, w: 126 } }
          ],
          edges: [
            { id: "e1", from: "a", to: "i", type: "association" },
            { id: "e2", from: "s", to: "a", type: "inheritance" },
            { id: "e3", from: "c", to: "i", type: "realization" }
          ]
        },
        {
          label: "SalesCsvReport and SalesMarkdownReport both inherit from SalesReport, which inherits from Report.",
          width: 330, height: 200,
          nodes: [
            { id: "a", kind: "abstract", name: "Report", key: true, at: { x: 105, y: 8, w: 120 } },
            { id: "s", kind: "concrete", name: "SalesReport", at: { x: 105, y: 72, w: 120 } },
            { id: "c", kind: "concrete", name: "SalesCsvReport", at: { x: 8, y: 150, w: 150 } },
            { id: "m", kind: "concrete", name: "SalesMdReport", at: { x: 172, y: 150, w: 150 } }
          ],
          edges: [
            { id: "e1", from: "s", to: "a", type: "inheritance" },
            { id: "e2", from: "c", to: "s", type: "inheritance" },
            { id: "e3", from: "m", to: "s", type: "inheritance" }
          ]
        },
        {
          label: "Report inherits from CsvRenderer; SalesReport inherits from Report.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "concrete", name: "CsvRenderer", at: { x: 100, y: 10, w: 130 } },
            { id: "a", kind: "abstract", name: "Report", key: true, at: { x: 100, y: 70, w: 130 } },
            { id: "s", kind: "concrete", name: "SalesReport", at: { x: 100, y: 150, w: 130 } }
          ],
          edges: [
            { id: "e1", from: "a", to: "c", type: "inheritance" },
            { id: "e2", from: "s", to: "a", type: "inheritance" }
          ]
        }
      ],
      answer: 0,
      hint: "In Bridge, the abstraction HAS an implementation; it does not inherit from one.",
      explain: "A is right: Report holds a reference to the Renderer interface (the bridge), and each side has its own subclasses. B is the class explosion Bridge removes (one subclass per format). C makes the report inherit a format, so it can never switch format."
    }
  ],
  cards: [
    { id: "b-intent", front: "Bridge: what is its intent, in one line?", back: "Split a class that varies in two ways into two hierarchies (abstraction and implementation) joined by one reference, so each side grows on its own." },
    { id: "b-vs-adapter", front: "Bridge vs Adapter: when is each one used?", back: "Adapter is a fix after the fact: make an existing class fit an interface. Bridge is designed up front so two sides can vary independently." },
    { id: "b-solid", front: "Which SOLID principles does Bridge mainly apply?", back: "Single Responsibility (what vs how), Open/Closed (a new report or format touches nothing else) and Dependency Inversion (the abstraction depends on an interface)." },
    { id: "b-spot", front: "Which pattern is hiding here?", code: { lang: "python", text: "log = logging.getLogger(\"shop\")\nlog.addHandler(logging.FileHandler(\"shop.log\"))" }, back: "Bridge. The logger decides what to log; the handler decides where it goes. Any logger works with any handler." },
    { id: "b-uml", front: "UML: in a Bridge diagram, which line is “the bridge”?", back: "The association (solid line, open arrow) from the abstraction to the implementation interface. It is a has-a link, not inheritance." },
    { id: "b-when-not", front: "When should you NOT use Bridge?", back: "When only one thing varies, or the hierarchy is small and stable. A plain interface is simpler, and the extra layer will not pay off." }
  ]
};

export default quiz;
