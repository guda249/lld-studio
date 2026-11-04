import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "abstract-factory",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What does the Abstract Factory pattern guarantee?",
      options: [
        "Only one instance of each product is ever created",
        "Related products used together always come from the same family",
        "A complex object is built step by step",
        "A subclass decides which single product to create"
      ],
      answer: 1,
      hint: "Think of the cloud example: what went wrong in the GCP branch of the problem code?",
      explain: "One factory object creates every product of one family, so a GCP storage can never end up next to an AWS queue. The other options describe Singleton, Builder and Factory Method."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Tap the line that breaks the family guarantee.",
      code: { lang: "scala", text: `class ReportService(cloud: CloudFactory):
  private val storage = cloud.createStorage()
  private val queue = SqsQueue()

  def publishReport(name: String): String =
    val path = storage.upload(name)
    queue.publish(s"report ready at $path")` },
      answer: 3,
      hint: "Which line names a concrete class instead of asking the factory?",
      explain: "Line 3 creates SqsQueue directly, so with GcpFactory you get GCP storage and an AWS queue again. It should be cloud.createQueue(), so both products come from the same factory."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Python code use?",
      code: { lang: "python", text: `class WindowsUI(UIFactory):
    def create_button(self) -> Button:
        return WinButton()

    def create_menu(self) -> Menu:
        return WinMenu()

def build_toolbar(ui: UIFactory) -> str:
    return ui.create_button().draw() + ui.create_menu().draw()` },
      options: ["Factory Method", "Abstract Factory", "Builder", "Bridge"],
      answer: 1,
      hint: "Count how many kinds of product one object can create, and how the client gets that object.",
      explain: "One factory object (passed in as ui) creates a family of related products, a button and a menu that match. Factory Method makes one product through subclassing the user of it. Builder assembles one object step by step. Bridge splits an abstraction from its implementation."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "Your app has AwsFactory and GcpFactory, each making Storage and Queue. Now every cloud also needs a Secrets product. What does that cost?",
      options: [
        "Nothing: the client picks Secrets itself",
        "One new class, AwsSecrets, and nothing else",
        "A new method on CloudFactory, plus a new method and a new product class in every concrete factory",
        "A new concrete factory, AzureFactory"
      ],
      answer: 2,
      hint: "Adding a new family is cheap. Is adding a new kind of product the same thing?",
      explain: "A new product kind changes the factory interface, so every concrete factory must add a method and its own Secrets class. That is the main weakness of Abstract Factory. Adding a whole new family (AzureFactory) is the cheap direction."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of ReportService(GcpFactory()).publish_report(\"q3.pdf\") in order.",
      steps: [
        "The demo passes a GcpFactory to ReportService",
        "ReportService asks the factory for storage and gets GcsStorage",
        "ReportService asks the factory for a queue and gets PubSubQueue",
        "publish_report uploads the file through Storage",
        "It publishes the message through Queue"
      ],
      shuffled: [3, 1, 4, 0, 2],
      hint: "Products are created in the constructor, before any report is published.",
      explain: "The factory is passed in first, the constructor creates both products from it, and only then does publish_report use them: upload first, because the message needs the file's path."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows Abstract Factory correctly?",
      options: [
        {
          label: "Client uses the CloudFactory interface; AwsFactory implements it and creates S3Storage and SqsQueue.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 8, y: 14, w: 90, h: 52 } },
            { id: "f", kind: "interface", name: "CloudFactory", key: true, at: { x: 150, y: 14, w: 130 } },
            { id: "a", kind: "concrete", name: "AwsFactory", key: true, at: { x: 150, y: 86, w: 130 } },
            { id: "s", kind: "concrete", name: "S3Storage", at: { x: 8, y: 150, w: 120 } },
            { id: "q", kind: "concrete", name: "SqsQueue", at: { x: 202, y: 150, w: 120 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "f", type: "association" },
            { id: "e2", from: "a", to: "f", type: "realization" },
            { id: "e3", from: "a", to: "s", type: "dependency", route: "straight" },
            { id: "e4", from: "a", to: "q", type: "dependency", route: "straight" }
          ]
        },
        {
          label: "Client creates S3Storage and SqsQueue directly, and AwsFactory is not used.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 120, y: 14, w: 90, h: 52 } },
            { id: "a", kind: "concrete", name: "AwsFactory", at: { x: 220, y: 80, w: 100 } },
            { id: "s", kind: "concrete", name: "S3Storage", at: { x: 8, y: 150, w: 120 } },
            { id: "q", kind: "concrete", name: "SqsQueue", at: { x: 202, y: 150, w: 120 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "s", type: "dependency", route: "straight" },
            { id: "e2", from: "c", to: "q", type: "dependency", route: "straight" }
          ]
        },
        {
          label: "S3Storage and SqsQueue both inherit from AwsFactory, and the client uses AwsFactory.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 8, y: 14, w: 90, h: 52 } },
            { id: "a", kind: "concrete", name: "AwsFactory", key: true, at: { x: 160, y: 20, w: 130 } },
            { id: "s", kind: "concrete", name: "S3Storage", at: { x: 100, y: 140, w: 110 } },
            { id: "q", kind: "concrete", name: "SqsQueue", at: { x: 220, y: 140, w: 102 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "a", type: "association" },
            { id: "e2", from: "s", to: "a", type: "inheritance" },
            { id: "e3", from: "q", to: "a", type: "inheritance" }
          ]
        }
      ],
      answer: 0,
      hint: "The client should depend on a factory interface, and products are created by the factory, not derived from it.",
      explain: "A is right: the client knows only the CloudFactory interface, and AwsFactory implements it and creates (dashed arrows) its family. In B the client creates concrete products itself, which is the original problem. In C the products inherit from the factory, but a product is not a kind of factory."
    }
  ],
  cards: [
    { id: "af-intent", front: "Abstract Factory: what is its intent, in one line?", back: "Give the client one factory object that creates a whole family of related products, so products from different families are never mixed." },
    { id: "af-vs-fm", front: "Abstract Factory vs Factory Method?", back: "Abstract Factory: an object you pass in, with one creation method per product of a family. Factory Method: one creation method that a subclass overrides. An abstract factory's methods are often factory methods." },
    { id: "af-solid", front: "Which SOLID principles does Abstract Factory apply?", back: "Dependency Inversion (the client uses only interfaces), Open/Closed for new families (a new factory) and Single Responsibility (creation is apart from use). Adding a new product kind is NOT closed: every factory changes." },
    { id: "af-spot", front: "Which pattern is hiding here?", code: { lang: "scala", text: "def screen(theme: ThemeFactory) =\n  val card = theme.createCard()\n  val button = theme.createButton()\n  card.render(\"Order\") + button.render(\"Track\")" }, back: "Abstract Factory. One theme object creates both widgets, so the card and the button always match." },
    { id: "uml-dep", front: "UML: what does a dashed line with an open arrowhead mean?", back: "Dependency: one class uses or creates another without keeping it as a field, like AwsFactory creating S3Storage." },
    { id: "af-when-not", front: "When should you NOT use Abstract Factory?", back: "When there is only one family, or the products are not related. Plain constructors or a single factory function are simpler." }
  ]
};

export default quiz;
