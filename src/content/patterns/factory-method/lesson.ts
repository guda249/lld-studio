import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-export.py?raw";
import ex1Scala from "./code/ex1-export.scala?raw";
import ex2Py from "./code/ex2-checkout.py?raw";
import ex2Scala from "./code/ex2-checkout.scala?raw";
import ex3Py from "./code/ex3-enemy.py?raw";
import ex3Scala from "./code/ex3-enemy.scala?raw";
import ex4Py from "./code/ex4-testing.py?raw";
import ex4Scala from "./code/ex4-testing.scala?raw";

const lesson: PatternLesson = {
  slug: "factory-method",
  analogy:
    "A restaurant franchise. Head office writes the process for serving a thali: plate it, add the main dish, serve. Each branch decides which main dish goes on the plate: biryani in Hyderabad, fish curry in Kolkata. The serving process never changes.",
  problem: {
    text: "OrderNotifier.send() decides which message class to create with an if/else on the channel name, and then sends it. Creation logic is mixed with business logic, the class must know every concrete message type, and every new channel (push, WhatsApp) means editing this method again.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Move the object creation into its own overridable method, the factory method (create_message). The base class's send() uses whatever that method returns, through the Message interface only. Each subclass overrides the factory method to return its own product, so adding a channel means adding a subclass, not editing send().",
  participants: [
    { role: "Product", name: "Message", kind: "interface", description: "The interface of what gets created; send() only ever talks to this." },
    { role: "Concrete product", name: "EmailMessage, SmsMessage", kind: "concrete", description: "The real objects returned by the factory method." },
    { role: "Creator", name: "Notifier", kind: "abstract", description: "Declares the factory method create_message() and holds the business logic (send) that uses it." },
    { role: "Concrete creator", name: "EmailNotifier, SmsNotifier", kind: "concrete", description: "Override the factory method to decide which concrete product is made." },
    { role: "Client", name: "Demo code", kind: "client", description: "Picks a notifier and calls send(); it never creates messages itself." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "Both languages have first-class functions, so the factory can simply be passed in: Notifier(SmsMessage) in Python (a class is already a callable factory) or Notifier(() => SmsMessage()) in Scala. No subclass per product is needed. Keep the subclass version for frameworks where users are expected to extend a base class.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Every collection's iterator() in Java and Scala, or __iter__ in Python: each collection returns its own iterator type.",
    "Django class-based views: override get_form_class() or get_queryset() to choose what gets created.",
    "Python logging handlers and unittest's TestLoader, where subclasses decide which object to make.",
    "GUI toolkits and game engines that let a subclass decide which component or entity to create.",
  ],
  whenToUse: [
    "The base class knows when to create an object but not which class.",
    "You are writing a framework or library and want users to plug in their own classes.",
    "You want the knowledge of concrete classes kept in one overridable place, for example to swap in fakes during tests.",
  ],
  whenNotToUse: [
    "There is only one product type and no sign of more: just call the constructor.",
    "A dictionary of constructors or a passed-in function is enough, which is very often true in Python and Scala.",
  ],
  pros: [
    "Removes tight coupling between the creator and the concrete products (Open/Closed, Dependency Inversion).",
    "Creation code lives in one place (Single Responsibility).",
    "Tests can override just the factory method to inject a fake.",
  ],
  cons: [
    "One subclass per product can mean many small classes.",
    "The flow is spread over a class hierarchy, which can be harder to follow than one function call.",
  ],
  confusedWith: [
    { name: "Abstract Factory", difference: "Abstract Factory creates a whole family of related products, usually through an object you pass in. Factory Method creates one product, chosen by subclassing." },
    { name: "Simple Factory", difference: "A static method with an if/else or match on a type name. Common and useful, but not a GoF pattern and not open for extension: every new type edits it." },
    { name: "Template Method", difference: "A factory method is often one step inside a template method: the step that creates the thing the rest of the algorithm uses." },
  ],
  solid:
    "Open/Closed (a new product is a new subclass, send() stays untouched), Dependency Inversion (the creator depends on the Message interface, not on concrete classes) and Single Responsibility (creation is separated from use).",
  interviewUses: [
    "Notification service: channel-specific messages.",
    "Parking lot: creating the right vehicle or ticket type.",
    "Logging framework: creating handlers or formatters.",
    "Document editor: creating pages or elements per document type.",
  ],
  examples: [
    {
      id: "export",
      domain: "Analytics",
      title: "Report export formats",
      situation:
        "A sales dashboard exports daily reports as CSV for finance and JSON for another team's API. The export code checked the format with if/else in several places, so adding Excel meant hunting through every one of them.",
      roles: [
        { role: "Product", name: "Formatter" },
        { role: "Concrete product", name: "CsvFormatter, JsonFormatter" },
        { role: "Creator", name: "ReportExporter" },
        { role: "Concrete creator", name: "CsvExporter, JsonExporter" },
      ],
      why: "The export steps (check for data, format, add a header) are the same for every format; only the formatter differs. export_report() keeps the steps, and create_formatter() is the one place a subclass chooses the format.",
      goodToKnow:
        "Here the factory method is one step inside a template method. That pairing is very common in report and pipeline code.",
      walkthrough: [
        "The demo has two sales rows, for Pune and Jaipur.",
        "CsvExporter.export_report() checks that there is data, then calls create_formatter(), which returns a CsvFormatter.",
        "The formatter turns the rows into CSV, and the base class adds a header with the file name and row count.",
        "JsonExporter runs the same export_report() but its factory method returns a JsonFormatter.",
        "An empty day returns early with a short message, before any formatter is created.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "checkout",
      domain: "E-commerce",
      title: "Checkout payment gateway",
      situation:
        "An online store charges most orders by UPI, but some partner stores must use cards with a 2% fee. Copying the whole checkout class for card payments would duplicate the order checks.",
      roles: [
        { role: "Product", name: "PaymentGateway" },
        { role: "Concrete product", name: "UpiGateway, CardGateway" },
        { role: "Creator", name: "Checkout" },
        { role: "Concrete creator", name: "CardCheckout" },
      ],
      why: "Only the choice of gateway changes. Checkout gives create_gateway() a sensible default (UPI), and CardCheckout overrides just that one method; pay() is inherited untouched.",
      goodToKnow:
        "The creator does not have to be abstract. A concrete default factory method is often the friendliest design: most users never subclass at all.",
      walkthrough: [
        "Checkout().pay() for ₹499 checks the amount, then asks create_gateway() for a gateway.",
        "The default factory method returns UpiGateway, which sends a UPI collect request.",
        "CardCheckout().pay() runs the same pay() for ₹1200, but its factory method returns CardGateway.",
        "CardGateway adds the 2% fee and reports ₹1224.00.",
        "A zero amount is rejected before any gateway is created.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "enemy",
      domain: "Games",
      title: "Enemy spawning per level",
      situation:
        "A game has a forest level and a desert level. The wave logic (later waves bring more enemies) is the same everywhere, but each level was hard-coding its own enemy class inside a copy of that logic.",
      roles: [
        { role: "Product", name: "Enemy" },
        { role: "Concrete product", name: "Wolf, Scorpion" },
        { role: "Creator", name: "Level" },
        { role: "Concrete creator", name: "ForestLevel, DesertLevel" },
      ],
      why: "spawn_wave() owns the shared rule and calls create_enemy() once per enemy. Each level only answers one question: which enemy, and how strong for this wave.",
      goodToKnow:
        "A factory method can take parameters. Passing the wave number lets each level scale its enemies without the base class knowing how.",
      walkthrough: [
        "ForestLevel spawns wave 1: the base class asks for wave + 1 = 2 enemies.",
        "Each call to create_enemy(1) returns a Wolf with 50 HP.",
        "Wave 2 brings 3 wolves with 60 HP each.",
        "DesertLevel runs the same spawn_wave() but its factory method returns scorpions.",
        "The demo adds up all waves and prints 10 enemies spawned.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "testing",
      domain: "Dev tools",
      title: "Swapping in a fake for tests",
      situation:
        "A weather service calls a real HTTP client inside its advice() method. Unit tests cannot hit the network, and the client is created deep inside the method, so there is nothing to replace.",
      roles: [
        { role: "Product", name: "HttpClient" },
        { role: "Concrete product", name: "RealHttpClient, FakeHttpClient" },
        { role: "Creator", name: "WeatherService" },
        { role: "Concrete creator", name: "FakeWeatherService" },
      ],
      why: "Pulling the client creation into create_client() gives tests a seam: a test subclass overrides only that method and returns a fake, while advice() is tested exactly as it runs in production.",
      goodToKnow:
        "This is the subclass-and-override testing trick. If you control the constructor, passing the client in (dependency injection) is usually simpler.",
      walkthrough: [
        "The test creates a FakeHttpClient that always reports 41°C.",
        "FakeWeatherService.advice(\"Nagpur\") runs the real advice() logic, but create_client() returns the fake.",
        "The fake records the URL it was called with, so the test can check it.",
        "At 41°C the advice is \"carry water\".",
        "The plain WeatherService uses the real client, which in this offline demo raises an error.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
