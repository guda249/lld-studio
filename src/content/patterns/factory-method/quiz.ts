import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "factory-method",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What does the Factory Method pattern let a base class do?",
      options: [
        "Copy an existing object instead of building a new one",
        "Use an object without knowing its concrete class, by letting subclasses decide which class to create",
        "Make sure only one instance of a class ever exists",
        "Build a complex object one step at a time"
      ],
      answer: 1,
      hint: "In the notifier example, send() knows WHEN a message is needed. Who knows WHICH message?",
      explain: "The base class calls an overridable creation method and works with the result through an interface; each subclass picks the concrete class. The other options describe Prototype, Singleton and Builder."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Tap the line that undoes the Factory Method here.",
      code: { lang: "python", text: `class Notifier(ABC):
    @abstractmethod
    def create_message(self) -> Message: ...

    def send(self, text: str) -> str:
        message = EmailMessage()
        return message.deliver(text)` },
      answer: 6,
      hint: "The factory method is declared. Is it actually used?",
      explain: "Line 6 creates EmailMessage directly, so every subclass sends email no matter what create_message() returns. send() should call self.create_message() and let the subclass decide."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `abstract class Dialog:
  protected def createButton(): Button

  def render(): String =
    val ok = createButton()
    s"[dialog] \${ok.draw()}"

class WebDialog extends Dialog:
  protected def createButton(): Button = HtmlButton()` },
      options: ["Abstract Factory", "Factory Method", "Template Method only", "Builder"],
      answer: 1,
      hint: "How many kinds of product are made, and how is the choice made: by subclassing or by passing an object in?",
      explain: "One product (Button), created through an overridable method that a subclass (WebDialog) overrides: Factory Method. Abstract Factory would pass in a factory object that makes a whole family (buttons, checkboxes...). render() is template-like, but the point here is the creation step. Builder assembles one object in steps."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "Your Python service has three report formats. A teammate suggests a base class and one subclass per format, each overriding create_formatter(). The formats will not grow and nobody extends this code. What is the simplest good choice?",
      options: [
        "Keep the subclass-per-format Factory Method",
        "Use a dict that maps the format name to the formatter class",
        "Make the formatter a Singleton",
        "Add an Abstract Factory for formatters"
      ],
      answer: 1,
      hint: "Factory Method shines when users extend a framework. Is anyone extending this?",
      explain: "In Python a class is already a callable factory, so {\"csv\": CsvFormatter, ...} does the job with no extra classes. Factory Method is worth it when others must plug in their own classes. Singleton and Abstract Factory solve different problems."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of SmsNotifier().send(text) in the right order.",
      steps: [
        "The demo calls send(text) on an SmsNotifier",
        "The inherited send() calls create_message()",
        "SmsNotifier's override returns a new SmsMessage",
        "send() calls deliver(text) through the Message interface",
        "\"SMS: ...\" travels back to the demo"
      ],
      shuffled: [2, 4, 0, 3, 1],
      hint: "The base class runs first, then asks the subclass for the object, then uses it.",
      explain: "The client calls the creator, the shared send() asks the factory method for a product, the subclass decides it is an SmsMessage, and send() uses it only through Message before returning the result."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows Factory Method correctly?",
      options: [
        {
          label: "Notifier uses EmailMessage directly; EmailNotifier inherits from Notifier.",
          width: 330, height: 200,
          nodes: [
            { id: "n", kind: "abstract", name: "Notifier", key: true, at: { x: 8, y: 14, w: 130 } },
            { id: "m", kind: "concrete", name: "EmailMessage", at: { x: 190, y: 20, w: 130 } },
            { id: "e", kind: "concrete", name: "EmailNotifier", at: { x: 8, y: 130, w: 130 } }
          ],
          edges: [
            { id: "e1", from: "n", to: "m", type: "association" },
            { id: "e2", from: "e", to: "n", type: "inheritance" }
          ]
        },
        {
          label: "Abstract Notifier uses the Message interface; EmailNotifier inherits from Notifier and EmailMessage implements Message.",
          width: 330, height: 200,
          nodes: [
            { id: "n", kind: "abstract", name: "Notifier", key: true, at: { x: 8, y: 14, w: 130 } },
            { id: "m", kind: "interface", name: "Message", key: true, at: { x: 190, y: 14, w: 130 } },
            { id: "e", kind: "concrete", name: "EmailNotifier", at: { x: 8, y: 130, w: 130 } },
            { id: "f", kind: "concrete", name: "EmailMessage", at: { x: 190, y: 130, w: 130 } }
          ],
          edges: [
            { id: "e1", from: "n", to: "m", type: "association" },
            { id: "e2", from: "e", to: "n", type: "inheritance" },
            { id: "e3", from: "f", to: "m", type: "realization" }
          ]
        },
        {
          label: "Message inherits from Notifier; EmailMessage and EmailNotifier both inherit from Message.",
          width: 330, height: 200,
          nodes: [
            { id: "n", kind: "concrete", name: "Notifier", key: true, at: { x: 100, y: 8, w: 130 } },
            { id: "m", kind: "concrete", name: "Message", at: { x: 100, y: 74, w: 130 } },
            { id: "e", kind: "concrete", name: "EmailNotifier", at: { x: 8, y: 150, w: 130 } },
            { id: "f", kind: "concrete", name: "EmailMessage", at: { x: 192, y: 150, w: 130 } }
          ],
          edges: [
            { id: "e1", from: "m", to: "n", type: "inheritance" },
            { id: "e2", from: "e", to: "m", type: "inheritance" },
            { id: "e3", from: "f", to: "m", type: "inheritance" }
          ]
        }
      ],
      answer: 1,
      hint: "There should be two parallel hierarchies: creators on one side, products on the other.",
      explain: "B is right: the abstract creator depends only on the Message interface, the concrete creator extends the creator, and the concrete product implements Message. In A the creator is tied to one concrete product. In C creators and products are mixed into one inheritance chain, which is not how creation is separated from use."
    }
  ],
  cards: [
    { id: "fm-intent", front: "Factory Method: what is its intent, in one line?", back: "Declare a creation method in a base class and let subclasses override it to decide which concrete class gets made." },
    { id: "fm-vs-af", front: "Factory Method vs Abstract Factory?", back: "Factory Method: one product, chosen by overriding a method in a subclass. Abstract Factory: a whole family of related products, made by a factory object you pass in." },
    { id: "fm-solid", front: "Which SOLID principles does Factory Method apply?", back: "Open/Closed (a new product is a new subclass), Dependency Inversion (the creator uses the product interface) and Single Responsibility (creation is apart from use)." },
    { id: "fm-spot", front: "Which pattern is hiding here?", code: { lang: "python", text: "class MyList(list):\n    def __iter__(self):\n        return MyIterator(self)" }, back: "Factory Method. __iter__ is a creation method that each collection overrides to return its own iterator type." },
    { id: "uml-inherit", front: "UML: what does a solid line with a hollow triangle mean?", back: "Inheritance (generalisation): the class at the plain end extends the class at the triangle, like EmailNotifier extends Notifier." },
    { id: "fm-when-not", front: "When should you NOT use Factory Method?", back: "When there is one product, or a passed-in function or a dict of classes is enough. In Python and Scala that is often the case." }
  ]
};

export default quiz;
