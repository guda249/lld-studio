import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "template-method",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What does the Template Method pattern do?",
      options: [
        "Lets the client swap the whole algorithm at runtime",
        "Fixes the steps of an algorithm in a base class method and lets subclasses fill in some of the steps",
        "Creates a copy of an object from a prototype",
        "Wraps an object to add behaviour before and after its calls"
      ],
      answer: 1,
      hint: "Think of run(): parse, then validate, then save. What is fixed and what varies?",
      explain: "The base class method (the template method) fixes the order of steps; subclasses override only the steps that differ. Swapping the whole algorithm from outside is Strategy, copying is Prototype and wrapping is Decorator."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Tap the line that breaks the template method.",
      code: { lang: "python", text: `class DataImporter(ABC):
    def run(self, raw: str) -> list[Record]:
        records = self.parse(raw)
        valid = [r for r in records if self.is_valid(r)]
        self.save(valid)
        return valid

class QuickImporter(DataImporter):
    def run(self, raw: str) -> list[Record]:
        return self.parse(raw)` },
      answer: 9,
      hint: "Which method should subclasses never override?",
      explain: "Line 9 overrides run() itself, so QuickImporter skips validation and saving and the fixed order is lost. Subclasses should override steps such as parse() or hooks, never the template method. In Scala, mark run() as final to stop this."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `abstract class Report:
  final def build(): String =
    header() + body() + footer()

  protected def header(): String = "Report\\n"
  protected def body(): String
  protected def footer(): String = "-- end --"

class SalesReport extends Report:
  protected def body(): String = "Sales: ₹4,20,000\\n"` },
      options: ["Strategy", "Factory Method", "Template Method", "Builder"],
      answer: 2,
      hint: "Look at build(): who decides the order of header, body and footer?",
      explain: "build() is final and calls the steps in a fixed order; SalesReport fills in only body(). That is Template Method. Strategy would pass the varying part in as an object, Factory Method would create an object, and Builder assembles a product step by step under the client's control."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A food app must apply one of five discount rules at checkout, and the rule is chosen per user while the app runs. Which fits better?",
      options: [
        "Template Method: a Checkout subclass per discount rule",
        "Strategy: a Discount object passed into Checkout",
        "Template Method with a hook for every rule",
        "Singleton: one global discount rule"
      ],
      answer: 1,
      hint: "Template Method fixes the choice when the class is written. Is that true here?",
      explain: "The rule changes at runtime per user, so composition (Strategy) fits: Checkout holds a Discount and you swap it. Template Method picks the variation by subclass, fixed when the code is written, and five subclasses or five hooks would be clumsy. A Singleton cannot vary per user."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of KeyValueImporter().run(raw) in the right order.",
      steps: [
        "The client calls run(raw)",
        "run() calls parse(raw), written in KeyValueImporter",
        "run() calls is_valid() on each record (KeyValueImporter's override)",
        "run() calls save(valid), the base class default",
        "run() returns the valid records to the client"
      ],
      shuffled: [2, 4, 0, 3, 1],
      hint: "The order is the one written in the base class's run(): parse, validate, save.",
      explain: "The client calls the template method, which calls parse first, then is_valid for each record, then save, and finally returns the result. Subclasses change what a step does, never the order."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows Template Method correctly?",
      options: [
        {
          label: "CsvImporter has a DataImporter interface field and calls it.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "concrete", name: "CsvImporter", at: { x: 8, y: 20, w: 120 } },
            { id: "i", kind: "interface", name: "DataImporter", members: ["+ run(raw)"], at: { x: 170, y: 14, w: 150 } },
            { id: "p", kind: "concrete", name: "CsvParser", at: { x: 185, y: 140, w: 120 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "i", type: "association" },
            { id: "e2", from: "p", to: "i", type: "realization" }
          ]
        },
        {
          label: "The abstract DataImporter has run() and an abstract parse(); CsvImporter and KvImporter extend it.",
          width: 330, height: 200,
          nodes: [
            { id: "b", kind: "abstract", name: "DataImporter", key: true, members: ["+ run(raw)", "# parse(raw)"], at: { x: 85, y: 8, w: 160 } },
            { id: "a", kind: "concrete", name: "CsvImporter", at: { x: 20, y: 146, w: 130 } },
            { id: "k", kind: "concrete", name: "KvImporter", at: { x: 180, y: 146, w: 130 } }
          ],
          edges: [
            { id: "e1", from: "a", to: "b", type: "inheritance" },
            { id: "e2", from: "k", to: "b", type: "inheritance" }
          ]
        },
        {
          label: "CsvImporter and KvImporter each have their own run() and no shared parent.",
          width: 330, height: 200,
          nodes: [
            { id: "a", kind: "concrete", name: "CsvImporter", members: ["+ run(raw)"], at: { x: 20, y: 60, w: 130 } },
            { id: "k", kind: "concrete", name: "KvImporter", members: ["+ run(raw)"], at: { x: 180, y: 60, w: 130 } }
          ],
          edges: []
        }
      ],
      answer: 1,
      hint: "Template Method is built on inheritance from an abstract class.",
      explain: "B is right: the abstract DataImporter owns run() and declares parse(); the subclasses extend it (solid line, hollow triangle). A is composition through an interface, which is Strategy. C has no shared parent, which is the copy-paste problem we started with."
    }
  ],
  cards: [
    { id: "tm-intent", front: "Template Method: what is its intent, in one line?", back: "Define the skeleton of an algorithm in one base class method, and let subclasses fill in some steps without changing the order." },
    { id: "tm-vs-strategy", front: "Template Method vs Strategy?", back: "Template Method: inheritance, varies single steps, fixed when the class is written. Strategy: composition, swaps the whole algorithm, can change at runtime." },
    { id: "tm-solid", front: "Which principles does Template Method mainly apply?", back: "Open/Closed (new subclasses need no change to the template method), Liskov Substitution (every subclass works as the base), and Don't Repeat Yourself." },
    { id: "tm-spot", front: "Which pattern is hiding here?", code: { lang: "python", text: `class TestLogin(unittest.TestCase):
    def setUp(self): self.app = make_app()
    def test_login(self): ...
    def tearDown(self): self.app.close()` }, back: "Template Method. unittest's run() calls setUp, the test and tearDown in a fixed order; you only fill in the steps (the Hollywood principle)." },
    { id: "uml-abstract", front: "UML: how do you show an abstract class and an abstract method?", back: "Write the class name in italics (or add «abstract») and mark the method {abstract} or in italics. Subclasses point to it with a solid line and a hollow triangle." },
    { id: "tm-when-not", front: "When should you NOT use Template Method?", back: "When the variation must be chosen at runtime or combined (use Strategy), or when the hierarchy grows deep and every level overrides hooks, making the flow hard to follow." }
  ]
};

export default quiz;
