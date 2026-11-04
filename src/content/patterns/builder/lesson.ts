import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-pizza.py?raw";
import ex1Scala from "./code/ex1-pizza.scala?raw";
import ex2Py from "./code/ex2-query.py?raw";
import ex2Scala from "./code/ex2-query.scala?raw";
import ex3Py from "./code/ex3-trip.py?raw";
import ex3Scala from "./code/ex3-trip.scala?raw";
import ex4Py from "./code/ex4-prescription.py?raw";
import ex4Scala from "./code/ex4-prescription.scala?raw";

const lesson: PatternLesson = {
  slug: "builder",
  analogy:
    "A sandwich counter. You choose the bread, then fillings, then sauces, then toasted or not. Nothing is handed over until you say done, and the counter refuses an invalid combination before it starts making it.",
  problem: {
    text: "HttpRequest takes eight positional arguments. This is a telescoping constructor: it is easy to swap two of them by mistake (here the timeout and the retry count), and there is no single place to check rules that span fields, such as a GET request must not have a body. The bad request below is created without any complaint.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "A separate builder object collects the settings through named, chainable methods such as method(), header() and timeout(), each with a sensible default. A final build() checks every rule once and returns the finished product, which is immutable. Callers only set what they need, and an invalid object is never created.",
  participants: [
    { role: "Builder", name: "HttpRequestBuilder", kind: "concrete", description: "Holds the settings while they are being chosen; offers chainable step methods and build(), which validates and creates the product." },
    { role: "Product", name: "HttpRequest", kind: "concrete", description: "The finished, immutable object. It exists only once all rules have passed." },
    { role: "Director", name: "Recipe functions (optional)", kind: "client", description: "A function that runs a fixed sequence of steps, such as a json_post(url, body) preset. See the pizza example." },
    { role: "Client", name: "Demo code", kind: "client", description: "Chains the steps it cares about and calls build()." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "Both languages have named and default arguments, which remove most of the need for a builder. A frozen dataclass or a case class with defaults gives readable construction, and dataclasses.replace() or copy() makes changed copies. Put cross-field checks in __post_init__ or require(). Keep a builder when construction happens in many steps, in several places, or needs a director.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Apache Spark: SparkSession.builder.appName(\"etl\").master(\"local[*]\").getOrCreate() in both PySpark and Scala.",
    "Java's HttpRequest.newBuilder() and StringBuilder; Scala's StringBuilder and collection builders.",
    "Query builders such as SQLAlchemy's select(...).where(...).order_by(...).",
    "Test-data builders that create valid objects with a few fields overridden.",
  ],
  whenToUse: [
    "Objects with many optional parameters or several valid configurations.",
    "Rules that span several fields and must be checked once, before the object exists.",
    "You want the finished object to be immutable but its construction to happen step by step.",
  ],
  whenNotToUse: [
    "A few parameters with simple defaults: named arguments are clearer.",
    "In Python or Scala, when dataclass or case class defaults plus replace() or copy() already cover it.",
  ],
  pros: [
    "Readable construction with no argument mix-ups.",
    "One place to validate; the result is immutable.",
    "The same steps can produce different variations, and directors can package common recipes.",
  ],
  cons: [
    "An extra class that mirrors the product's fields, and must be kept in sync with it.",
    "A mutable builder must not be shared between threads or reused carelessly.",
  ],
  confusedWith: [
    { name: "Abstract Factory", difference: "Abstract Factory returns several related objects at once. Builder returns one complex object at the end of several steps." },
    { name: "Fluent interface", difference: "Method chaining is only a style. A builder is about deferred, validated construction; it may or may not be fluent." },
    { name: "Prototype", difference: "Prototype makes new objects by copying a configured example. A builder assembles one from scratch, step by step." },
  ],
  solid:
    "Single Responsibility (construction and validation live in the builder, not in the product) and Open/Closed (new directors or presets can be added without touching the product).",
  interviewUses: [
    "Pizza or burger ordering systems.",
    "HTTP request or SQL query construction.",
    "Building a Vehicle or Meal in parking-lot and food-delivery designs.",
    "Configuring an immutable Order or Booking.",
  ],
  examples: [
    {
      id: "pizza",
      domain: "Food delivery",
      title: "Pizza orders with preset recipes",
      situation:
        "A pizza app lets customers pick size, crust, toppings and extra cheese, and also sells fixed menu pizzas. The order code was full of long constructor calls, and menu pizzas were built slightly differently in each screen.",
      roles: [
        { role: "Builder", name: "PizzaBuilder" },
        { role: "Product", name: "Pizza" },
        { role: "Director", name: "margherita(), farmhouse()" },
        { role: "Client", name: "Demo code" },
      ],
      why: "Customers make choices one at a time, and the rules (known size, at most five toppings) belong in one place. Director functions turn each menu item into a named recipe, so every screen builds it the same way.",
      goodToKnow:
        "Directors are optional. They pay off when the same sequence of steps appears in several places.",
      walkthrough: [
        "The margherita() director builds a medium pizza with basil and extra cheese.",
        "build() checks the size and topping count, then returns an immutable Pizza priced at ₹449.",
        "farmhouse() builds a large thin-crust pizza with three toppings for ₹619.",
        "A custom order chains its own steps: small, cheese burst crust, paneer and jalapeno.",
        "All three pizzas come out of the same builder and the same validation.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "query",
      domain: "Dev tools",
      title: "SQL query builder",
      situation:
        "A product search screen adds filters depending on what the user picked. Gluing SQL strings together by hand kept producing broken queries, and a value pasted into the SQL text opened the door to SQL injection.",
      roles: [
        { role: "Builder", name: "QueryBuilder" },
        { role: "Product", name: "Query" },
        { role: "Client", name: "Demo code" },
      ],
      why: "Each filter is one more step, added only when needed. build() assembles the clauses in the right order, keeps values in a separate params list and rejects LIMIT without ORDER BY.",
      goodToKnow:
        "Never put user values into the SQL text, even in a builder: always use placeholders and pass the values separately, as here.",
      walkthrough: [
        "The demo selects name and price from products.",
        "Two where() calls add conditions with ? placeholders and store \"shoes\" and 2500 as parameters.",
        "order_by() and limit() are added, and build() puts every clause in the right order.",
        "A second, simpler query uses only one where() and gets SELECT * by default.",
        "A query with LIMIT but no ORDER BY is rejected by build().",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "trip",
      domain: "Travel",
      title: "Immutable trip search builder",
      situation:
        "A travel site keeps a draft search (route, date, travellers) and lets the user try one-way and return options from it. With a mutable builder, adding a return date for one option quietly changed the draft for the others.",
      roles: [
        { role: "Builder", name: "TripBuilder" },
        { role: "Product", name: "Trip" },
        { role: "Client", name: "Demo code" },
      ],
      why: "Here the builder itself is immutable: each step returns a new builder. A draft can be shared and branched into several variations without one branch changing another.",
      goodToKnow:
        "Immutable builders create a small object per step. That cost is tiny for a handful of steps but worth knowing about in very hot loops.",
      walkthrough: [
        "The draft sets the route Delhi to Goa, the departure date 20 December and two travellers.",
        "build() on the draft gives a one-way trip.",
        "returning() creates a new builder with a return date, and its build() gives a round trip.",
        "The original draft is unchanged, so both trips are correct.",
        "A return date before departure is rejected by build().",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "prescription",
      domain: "Healthcare",
      title: "Prescription with full validation",
      situation:
        "A clinic app creates digital prescriptions. The old form stopped at the first mistake, so doctors fixed one error, submitted, and then hit the next one.",
      roles: [
        { role: "Builder", name: "PrescriptionBuilder" },
        { role: "Product", name: "Prescription" },
        { role: "Client", name: "Demo code" },
      ],
      why: "The builder gathers medicines one by one, and build() is the one place that knows all the rules: a doctor's registration number, at least one medicine and daily dose limits. It collects every problem and reports them together.",
      goodToKnow:
        "Collecting all errors suits forms and imports. For programmer mistakes inside code, failing on the first error is usually simpler.",
      walkthrough: [
        "The first prescription is signed by a doctor and adds paracetamol and cetirizine.",
        "build() checks the rules, finds none broken and returns an immutable Prescription.",
        "The second prescription has no doctor and two high doses.",
        "build() collects all three problems instead of stopping at the first one.",
        "The demo prints them as a single message the doctor can fix in one go.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
