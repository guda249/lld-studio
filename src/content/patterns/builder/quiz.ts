import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "builder",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What problem does the Builder pattern solve?",
      options: [
        "Choosing between families of related objects",
        "Creating a complex object step by step, with named settings and one final check",
        "Sharing one instance across the whole program",
        "Copying an existing object instead of creating a new one"
      ],
      answer: 1,
      hint: "Think of the HTTP request with eight positional arguments.",
      explain: "A builder collects settings through named steps with defaults, and build() validates them once before creating the product. The other options describe Abstract Factory, Singleton and Prototype."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Tap the line that lets an invalid request through.",
      code: { lang: "python", text: `class HttpRequestBuilder:
    def json_body(self, body: str) -> "HttpRequestBuilder":
        self._body = body
        return self

    def build(self) -> HttpRequest:
        return HttpRequest(self._method, self._url, self._body)` },
      answer: 7,
      hint: "Where should the rule \"a GET cannot have a body\" be checked?",
      explain: "Line 7 creates the product without checking anything, so a GET with a body is built. build() is the one place that sees every setting together, so it should check the cross-field rules before line 7 runs."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `val email = EmailBuilder()
  .to("asha@example.com")
  .subject("Your invoice")
  .attach("invoice.pdf")
  .build()` },
      options: ["Builder", "Decorator", "Chain of Responsibility", "Facade"],
      answer: 0,
      hint: "What happens at the very end of the chain?",
      explain: "Each call sets one part and returns the builder, and build() produces the finished email: Builder. Decorator wraps objects to add behaviour, Chain of Responsibility passes a request along handlers, and Facade simplifies a subsystem behind one interface."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A Python dataclass has three fields, all with sensible defaults, and no rules that span fields. A teammate wants to add a Builder. What is the better choice?",
      options: [
        "Add the Builder anyway, for consistency",
        "Use keyword arguments with defaults on the dataclass",
        "Make the dataclass a Singleton",
        "Add an Abstract Factory"
      ],
      answer: 1,
      hint: "What do named and default arguments already give you?",
      explain: "Keyword arguments with defaults already give named, readable construction. A builder pays off for many optional settings, cross-field rules, construction in several steps or a director. Singleton and Abstract Factory solve different problems."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of building the POST request in order.",
      steps: [
        "Create HttpRequestBuilder with the URL (defaults: GET, 10 s)",
        "Call method(\"post\")",
        "Call json_body(...) and timeout(5)",
        "build() checks the rules",
        "build() returns a frozen HttpRequest"
      ],
      shuffled: [3, 0, 4, 2, 1],
      hint: "Nothing is created until the very last step.",
      explain: "The builder starts with defaults, the named steps change settings one by one, and only build() validates and then creates the immutable product."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows Builder correctly?",
      options: [
        {
          label: "HttpRequest inherits from HttpRequestBuilder, and the client uses HttpRequest.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 8, y: 20, w: 90, h: 52 } },
            { id: "r", kind: "concrete", name: "HttpRequest", key: true, at: { x: 170, y: 20, w: 150 } },
            { id: "b", kind: "concrete", name: "HttpRequestBuilder", at: { x: 170, y: 130, w: 150 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "r", type: "association" },
            { id: "e2", from: "r", to: "b", type: "inheritance" }
          ]
        },
        {
          label: "The client uses HttpRequestBuilder, which creates HttpRequest.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 8, y: 20, w: 90, h: 52 } },
            { id: "b", kind: "concrete", name: "HttpRequestBuilder", key: true, members: ["+ method(m)", "+ build()"], at: { x: 150, y: 14, w: 170 } },
            { id: "r", kind: "concrete", name: "HttpRequest", key: true, at: { x: 170, y: 140, w: 130 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "b", type: "association" },
            { id: "e2", from: "b", to: "r", type: "dependency", label: "creates" }
          ]
        },
        {
          label: "HttpRequest is composed of many HttpRequestBuilder parts, and the client uses HttpRequest.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 8, y: 20, w: 90, h: 52 } },
            { id: "r", kind: "concrete", name: "HttpRequest", key: true, at: { x: 170, y: 20, w: 150 } },
            { id: "b", kind: "concrete", name: "HttpRequestBuilder", at: { x: 170, y: 140, w: 150 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "r", type: "association" },
            { id: "e2", from: "r", to: "b", type: "composition", toMult: "0..*" }
          ]
        }
      ],
      answer: 1,
      hint: "Who does the client talk to, and which object makes the product?",
      explain: "B is right: the client talks to the builder, and the builder creates the product (dashed arrow) in build(). In A the product inherits from its builder, but a request is not a kind of builder. In C the product owns builders, which turns the relationship upside down."
    }
  ],
  cards: [
    { id: "b-intent", front: "Builder: what is its intent, in one line?", back: "Build a complex object step by step through named methods, and create the finished (often immutable) product only in a final build() that checks every rule." },
    { id: "b-vs-af", front: "Builder vs Abstract Factory?", back: "Builder makes one complex object in several steps and returns it at the end. Abstract Factory returns several related, simple objects straight away." },
    { id: "b-solid", front: "Which SOLID principle does Builder mainly apply?", back: "Single Responsibility: collecting settings and validating them lives in the builder, apart from the product. Directors add reuse of fixed step sequences." },
    { id: "b-spot", front: "Which pattern is hiding here?", code: { lang: "python", text: "query = (QueryBuilder(\"orders\")\n         .where(\"status =\", \"PENDING\")\n         .order_by(\"id\")\n         .build())" }, back: "Builder. Each step adds one clause, and build() assembles them in the right order and checks the rules." },
    { id: "uml-dep", front: "UML: how do you show that build() creates the product?", back: "A dependency: a dashed line with an open arrowhead from the builder to the product, often labelled «create» or \"creates\"." },
    { id: "b-when-not", front: "When should you NOT use Builder?", back: "When an object has few fields and no cross-field rules. Keyword or named arguments with defaults (a dataclass or case class) are simpler." }
  ]
};

export default quiz;
