import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "decorator",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What problem does the Decorator pattern solve?",
      options: [
        "Converting one interface into another that a client expects",
        "Adding optional behaviours to one object at runtime, in any combination, without a subclass per combination",
        "Controlling access to an object that is expensive to create",
        "Letting the client swap one algorithm for another"
      ],
      answer: 1,
      hint: "Think of logging, caching and retries around one HTTP client. How many subclasses would you need without wrapping?",
      explain: "A decorator keeps the same interface, wraps one object and adds one behaviour, so layers stack in any mix at runtime. Changing the interface is Adapter, controlling access is Proxy, and swapping algorithms is Strategy."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Tap the line that breaks this decorator.",
      code: { lang: "python", text: `class LoggingClient(HttpClient):
    def __init__(self, inner: HttpClient) -> None:
        self._inner = inner

    def get(self, url: str) -> str:
        print(f"LOG GET {url}")
        return BasicHttpClient().get(url)` },
      answer: 7,
      hint: "A decorator should pass the call on to something. To what exactly?",
      explain: "Line 7 creates a fresh BasicHttpClient and ignores the wrapped object, so any layers inside (cache, retry) are skipped. It should return self._inner.get(url). The other lines are fine: it implements HttpClient and stores the wrapped client."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `trait Notifier:
  def send(msg: String): String

class Email extends Notifier:
  def send(msg: String) = s"email: $msg"

class WithSignature(inner: Notifier) extends Notifier:
  def send(msg: String) = inner.send(msg + "\\n-- Team")

val n: Notifier = WithSignature(Email())` },
      options: ["Adapter", "Proxy", "Decorator", "Composite"],
      answer: 2,
      hint: "Does WithSignature change the interface, guard access, hold many children, or add something and pass the call on?",
      explain: "WithSignature is a Notifier, holds exactly one Notifier, adds a signature and passes the call on: Decorator. An Adapter would change the interface, a Proxy would control access to one real object, and a Composite would hold many children."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A text editor needs bold, italic and underline on plain text, in any mix, chosen while the user types. A teammate suggests BoldText, BoldItalicText, BoldUnderlineText and so on. What should you suggest?",
      options: [
        "Keep the subclasses but share code through a helper class",
        "Use Decorator: Bold, Italic and Underline each wrap a Text and add one style",
        "Use Singleton so there is only one formatter",
        "Use Factory Method to pick the right subclass"
      ],
      answer: 1,
      hint: "Three optional styles that combine freely at runtime: how many classes do you want to write?",
      explain: "Three decorators cover all eight combinations, and they can be stacked while the user types. Subclasses still explode (a helper only hides the copying), a factory still needs every subclass to exist, and Singleton has nothing to do with combining behaviour."
    },
    {
      type: "order", tag: "Put in order",
      prompt: "client = LoggingClient(CachingClient(RetryClient(basic))). Put the steps of the first client.get(url) in order.",
      steps: [
        "LoggingClient prints the LOG line and passes the call in",
        "CachingClient misses the cache and passes the call in",
        "RetryClient calls BasicHttpClient, which fails once, so it tries again",
        "BasicHttpClient returns the HTML",
        "CachingClient stores the HTML on the way out"
      ],
      shuffled: [3, 0, 4, 2, 1],
      hint: "The call travels from the outermost layer inwards, and the answer travels back out.",
      explain: "Layers run from outside to inside on the way in (log, cache check, retry), the real client answers, and layers can act again on the way out (the cache stores the result)."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows the Decorator pattern correctly?",
      options: [
        {
          label: "LoggingClient extends BasicHttpClient; CachingClient extends LoggingClient.",
          width: 330, height: 200,
          nodes: [
            { id: "b", kind: "concrete", name: "BasicHttpClient", at: { x: 90, y: 14, w: 150 } },
            { id: "l", kind: "concrete", name: "LoggingClient", at: { x: 8, y: 140, w: 130 } },
            { id: "c", kind: "concrete", name: "CachingClient", at: { x: 192, y: 140, w: 130 } }
          ],
          edges: [
            { id: "e1", from: "l", to: "b", type: "inheritance" },
            { id: "e2", from: "c", to: "l", type: "inheritance", route: "straight" }
          ]
        },
        {
          label: "BasicHttpClient and ClientDecorator implement HttpClient; ClientDecorator also points to HttpClient.",
          width: 330, height: 200,
          nodes: [
            { id: "i", kind: "interface", name: "HttpClient", key: true, at: { x: 90, y: 14, w: 150 } },
            { id: "b", kind: "concrete", name: "BasicHttpClient", at: { x: 8, y: 140, w: 140 } },
            { id: "d", kind: "abstract", name: "ClientDecorator", key: true, at: { x: 172, y: 134, w: 150 } }
          ],
          edges: [
            { id: "e1", from: "b", to: "i", type: "realization" },
            { id: "e2", from: "d", to: "i", type: "realization" },
            { id: "e3", from: "d", to: "i", type: "association", via: [[316, 37], [316, 134]] }
          ]
        },
        {
          label: "HttpClient owns a list of BasicHttpClient objects through composition.",
          width: 330, height: 200,
          nodes: [
            { id: "i", kind: "concrete", name: "HttpClient", at: { x: 90, y: 14, w: 150 } },
            { id: "b", kind: "concrete", name: "BasicHttpClient", at: { x: 90, y: 140, w: 150 } }
          ],
          edges: [
            { id: "e1", from: "i", to: "b", type: "composition", toMult: "0..*" }
          ]
        }
      ],
      answer: 1,
      hint: "A decorator is a component and also has a component. Look for both lines.",
      explain: "B is right: ClientDecorator implements HttpClient (is-a) and also holds one HttpClient (has-a), so decorators can wrap the real client or each other. A is the subclass-per-combination problem. C is a whole that owns many parts, which looks like Composite, not Decorator."
    }
  ],
  cards: [
    { id: "d-intent", front: "Decorator: what is its intent, in one line?", back: "Wrap an object in another object with the same interface that adds one behaviour, so behaviours can be stacked at runtime." },
    { id: "d-vs-proxy", front: "Decorator vs Proxy: both keep the same interface. What is the difference?", back: "A decorator adds features and the client chooses the stack. A proxy controls access to one real object (lazy loading, permissions, remote calls) and usually creates it itself." },
    { id: "d-solid", front: "Which SOLID principles does Decorator mainly apply?", back: "Single Responsibility (one behaviour per decorator), Open/Closed (new behaviour without editing the component) and Liskov Substitution (a wrapped object works wherever the component is expected)." },
    { id: "d-spot", front: "Which pattern is hiding in this line?", code: { lang: "python", text: "reader = io.TextIOWrapper(io.BufferedReader(io.FileIO(\"a.txt\")))" }, back: "Decorator. Each stream wraps another stream and adds one thing: buffering, then text decoding." },
    { id: "uml-assoc-real", front: "UML: a class has a dashed line with a hollow triangle to an interface AND a solid arrow to the same interface. What does that say?", back: "It implements the interface (realization) and also holds a reference to one (association). Is-a plus has-a: the shape of a decorator." },
    { id: "d-when-not", front: "When should you NOT use Decorator?", back: "When the behaviour is always needed (put it in the class), or when code relies on the concrete type of the wrapped object, because the wrapper hides it." }
  ]
};

export default quiz;
