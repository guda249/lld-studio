import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-chai.py?raw";
import ex1Scala from "./code/ex1-chai.scala?raw";
import ex2Py from "./code/ex2-storage.py?raw";
import ex2Scala from "./code/ex2-storage.scala?raw";
import ex3Py from "./code/ex3-payments.py?raw";
import ex3Scala from "./code/ex3-payments.scala?raw";
import ex4Py from "./code/ex4-grades.py?raw";
import ex4Scala from "./code/ex4-grades.scala?raw";

const lesson: PatternLesson = {
  slug: "decorator",
  analogy:
    "A phone with a case, then a screen guard, then a grip. Each layer adds something, the phone still works exactly like a phone, and you choose which layers to put on and in what order.",
  problem: {
    text: "An HTTP client needs optional logging, caching and retries. With subclasses you need LoggingClient, CachingClient, LoggingCachingClient and so on: one class per combination. Three optional features already mean eight classes, and the logging code gets copied into several of them.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Each extra behaviour becomes a decorator: a class that implements HttpClient, holds another HttpClient, adds its one behaviour and passes the call on. Because a decorator is itself an HttpClient, decorators can wrap each other. The client builds the stack it needs at runtime, for example LoggingClient(CachingClient(RetryClient(BasicHttpClient()))).",
  participants: [
    { role: "Component", name: "HttpClient", kind: "interface", description: "The shared interface. Both the real client and every decorator implement it." },
    { role: "Concrete component", name: "BasicHttpClient", kind: "concrete", description: "The core behaviour that gets wrapped. Here it fails on its first call, like a flaky network." },
    { role: "Base decorator", name: "ClientDecorator", kind: "abstract", description: "Holds one wrapped HttpClient and passes every call to it by default." },
    { role: "Concrete decorator", name: "LoggingClient, CachingClient, RetryClient", kind: "concrete", description: "Each adds exactly one behaviour before or after passing the call on." },
    { role: "Client", name: "Demo code", kind: "client", description: "Chooses the layers and their order, then uses the stack as a plain HttpClient." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "When the component has a single method, it can just be a function type, and each decorator is a function that takes a function and returns a new one. In Scala that is a plain higher-order function. In Python be careful with the name: the @decorator syntax wraps a function once, when it is defined, for every caller. The Decorator pattern wraps one object at runtime, behind an interface, and different callers can get different stacks. They share the wrap-and-delegate idea but are not the same thing.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Java I/O: BufferedInputStream wrapping a FileInputStream; Python io.BufferedReader and io.TextIOWrapper wrapping a raw stream.",
    "Web middleware: WSGI and ASGI middleware wrap the app to add auth, compression or logging.",
    "HTTP client interceptors and retry or cache layers in cloud SDKs.",
    "Scala stackable traits (abstract override) for logging and metrics layers.",
  ],
  whenToUse: [
    "You need optional behaviours that can be combined, on individual objects, at runtime.",
    "A subclass for every combination would explode, or the class is final and cannot be subclassed.",
    "You want each cross-cutting concern (logging, caching, retries) in its own small class.",
  ],
  whenNotToUse: [
    "The behaviour is always needed: put it in the class itself.",
    "The order of layers matters a lot and is easy to get wrong; then assemble the stack in one place, such as a builder or factory.",
    "Code depends on the concrete type of the wrapped object; wrapping hides it.",
  ],
  pros: [
    "Mix and match behaviours; each decorator does one thing.",
    "New behaviours are added without editing existing classes.",
    "The stack is chosen at runtime, per object.",
  ],
  cons: [
    "Many small wrapper objects, and deeper stack traces when debugging.",
    "Order-dependent: a cache outside the retry layer behaves differently from one inside it.",
    "Identity checks and type checks see the outer wrapper, not the real object.",
  ],
  confusedWith: [
    { name: "Proxy", difference: "Also keeps the same interface, but a proxy controls access to one real object and usually creates it itself. Decorators add features, and the client stacks them." },
    { name: "Adapter", difference: "An adapter changes the interface; a decorator keeps it exactly the same." },
    { name: "Chain of Responsibility", difference: "A handler in a chain may stop the request; a decorator always passes it on to the object it wraps." },
    { name: "Composite", difference: "A composite holds many children; a decorator wraps exactly one." },
    { name: "Python @decorator syntax", difference: "Wraps a function at definition time for everyone. The pattern wraps an object at runtime, behind an interface, and only where you choose." },
  ],
  solid:
    "Single Responsibility (one behaviour per decorator), Open/Closed (new behaviour without editing BasicHttpClient) and Liskov Substitution (a decorated client is still an HttpClient and works wherever one is expected).",
  interviewUses: [
    "Coffee or pizza pricing with add-ons.",
    "Notification enrichment: add a signature, add a tracking link.",
    "Logging, metrics and rate-limit wrappers around an API client.",
    "Text formatting: bold, italic, underline on top of plain text.",
  ],
  examples: [
    {
      id: "chai",
      domain: "Food and beverage",
      title: "Chai shop add-ons",
      situation:
        "A café app sells chai and coffee with add-ons such as ginger, jaggery and oat milk. A class for every drink-and-add-on combination would never end, and customers can even ask for a double add-on.",
      roles: [
        { role: "Component", name: "Beverage" },
        { role: "Concrete component", name: "MasalaChai" },
        { role: "Base decorator", name: "AddOn" },
        { role: "Concrete decorator", name: "Ginger" },
      ],
      why: "Each add-on changes only the description and the price, and add-ons combine freely. Wrapping a beverage in an add-on gives another beverage, so any number of layers just works.",
      goodToKnow:
        "This is the classic interview version. In a real shop the menu would come from data, but the wrapping idea is the same.",
      walkthrough: [
        "A plain masala chai costs ₹40.",
        "Jaggery wraps the chai and adds ₹15; Ginger wraps that and adds ₹10.",
        "Each cost() call asks the wrapped drink first, then adds its own price, giving ₹65.",
        "OatMilk is applied twice to a filter coffee: ₹50 plus two lots of ₹35 is ₹120.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "storage",
      domain: "Cloud storage",
      title: "Layered storage encoding",
      situation:
        "A service stores secrets and must encode and scramble them before they reach disk. Some stores need only encoding, some need both, and the plain store must stay simple and testable.",
      roles: [
        { role: "Component", name: "DataStore" },
        { role: "Concrete component", name: "MemoryStore" },
        { role: "Base decorator", name: "StoreDecorator" },
        { role: "Concrete decorator", name: "Base64Layer, ReverseLayer" },
      ],
      why: "Each layer changes data on the way in and undoes the change on the way out. Stacking layers builds a pipeline, and reads unwind it in reverse order automatically.",
      goodToKnow:
        "The order of layers changes what lands on disk, as stores A and B show. Real code would use proper encryption in place of the toy ReverseLayer.",
      walkthrough: [
        "Store A is ReverseLayer around Base64Layer around a memory store; store B uses the opposite order.",
        "Writing the same secret to both leaves different raw text on each disk.",
        "Reading from A reverses first, then decodes the Base64 text.",
        "Both stores return the original secret, because every read undoes its own layer's write.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "payments",
      domain: "Fintech",
      title: "Stackable payment layers",
      situation:
        "Every payment in production must be audited and counted for metrics, but tests want a plain UPI gateway with no side effects. The extra behaviours should not be written into the gateway itself.",
      roles: [
        { role: "Component", name: "PaymentGateway" },
        { role: "Concrete component", name: "UpiGateway" },
        { role: "Concrete decorator", name: "Audited" },
        { role: "Concrete decorator", name: "Metered" },
      ],
      why: "This is the stackable-trait flavour: each layer calls super.pay(), which runs the next layer in line. Scala's abstract override and Python's method resolution order give you decorator stacking at class level.",
      goodToKnow:
        "Here the layers are chosen when the class is written, not per object at runtime. Use it when the stack is fixed; use wrapper objects when it changes from object to object.",
      walkthrough: [
        "The plain gateway pays with no audit line and returns UPI-1001.",
        "The production gateway stacks Audited, then Metered, then UpiGateway.",
        "Audited passes each pay() straight on to Metered, which counts the call and the amount.",
        "UpiGateway returns a reference, and Audited prints the audit line on the way back.",
        "The metrics show 2 payments and ₹1699 in total.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "grades",
      domain: "Education",
      title: "Function decorator vs Decorator pattern",
      situation:
        "A school app logs every grade calculation, and only some grade books, such as those used by visiting teachers, must also be audited. The team was mixing up Python's @decorator with the pattern.",
      roles: [
        { role: "Component", name: "GradeBook" },
        { role: "Concrete component", name: "SimpleGradeBook" },
        { role: "Concrete decorator", name: "AuditedGradeBook" },
        { role: "Function decorator", name: "logged" },
      ],
      why: "Logging every grade call is a fixed, global need, so a function decorator fits. Auditing one grade book is a per-object choice at runtime, which is what the Decorator pattern is for.",
      goodToKnow:
        "Writing @logged above a function is the same as grade_for = logged(grade_for): it runs once, when the module loads. Scala has no @ syntax for this; a higher-order function does the job.",
      walkthrough: [
        "grade_for is wrapped by logged once, so every call to it prints a log line.",
        "Recording Ravi's 72 on the plain grade book logs the grade B but prints no audit line.",
        "AuditedGradeBook wraps the same grade book for Ms. Iyer.",
        "Recording Meera's 91 through it logs the grade A and prints an audit line.",
        "Both entries end up in the one shared grade book: Ravi=B, Meera=A.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
