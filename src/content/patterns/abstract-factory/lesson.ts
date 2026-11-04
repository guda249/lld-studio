import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-theme.py?raw";
import ex1Scala from "./code/ex1-theme.scala?raw";
import ex2Py from "./code/ex2-payments.py?raw";
import ex2Scala from "./code/ex2-payments.scala?raw";
import ex3Py from "./code/ex3-database.py?raw";
import ex3Scala from "./code/ex3-database.scala?raw";
import ex4Py from "./code/ex4-board.py?raw";
import ex4Scala from "./code/ex4-board.scala?raw";

const lesson: PatternLesson = {
  slug: "abstract-factory",
  analogy:
    "Furnishing a room from one catalogue line. If you pick the Teak line, the chair, table and shelf all match. You never end up with a teak chair next to a steel table, because you only ever order from one line.",
  problem: {
    text: "ReportService picks its storage and queue classes with an if/else on the cloud name. Business code knows every cloud's classes, and nothing stops a mismatched pair: in the code below a copy-paste slip gives the GCP branch an AWS queue, and the program runs without any error.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Define a factory interface (CloudFactory) with one creation method per product: create_storage() and create_queue(). Each concrete factory (AwsFactory, GcpFactory) creates a matching set. Business code receives one factory object and never names a concrete class, so it can only ever get products from one family. Switching cloud means passing a different factory.",
  participants: [
    { role: "Abstract factory", name: "CloudFactory", kind: "interface", description: "Declares one creation method per product in the family." },
    { role: "Concrete factory", name: "AwsFactory, GcpFactory", kind: "concrete", description: "Each one creates a consistent family of products for one cloud." },
    { role: "Abstract product", name: "Storage, Queue", kind: "interface", description: "The interfaces the client uses for each kind of product." },
    { role: "Concrete product", name: "S3Storage, SqsQueue, GcsStorage, PubSubQueue", kind: "concrete", description: "The real implementations; each belongs to exactly one family." },
    { role: "Client", name: "ReportService", kind: "client", description: "Takes a factory, creates its products through it and uses only the interfaces." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "A family can be a plain bundle of matching functions (a frozen dataclass or a case class), stored in a dictionary keyed by a config value. One lookup picks the whole family, so mixing is still impossible, with no interfaces or subclasses. In Scala, stateless factories are often written as objects. Keep the class version when products carry state or several methods.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Cross-platform UI toolkits: one factory per operating system creates buttons, menus and dialogs that look native together.",
    "Database access layers: each driver supplies a matching connection, cursor or statement and SQL dialect.",
    "Multi-cloud or multi-vendor SDK wrappers (storage, queue and secrets per provider).",
    "Theming in design systems: light and dark component families.",
  ],
  whenToUse: [
    "Your code works with several families of related products, and mixing families is a bug.",
    "You want to switch the whole family with one configuration choice.",
    "You want business code to stay free of vendor- or platform-specific class names.",
  ],
  whenNotToUse: [
    "Only one family exists and another is unlikely; the extra interfaces add cost without benefit.",
    "The products are unrelated; use separate factory methods or plain constructors instead.",
  ],
  pros: [
    "Guarantees that products used together are compatible.",
    "Swaps a whole family in one place; a new family is a new factory (Open/Closed).",
    "Keeps concrete classes out of business code, which also makes it easy to plug in a fake family for tests.",
  ],
  cons: [
    "Adding a new kind of product (for example Secrets) changes the factory interface and every concrete factory.",
    "Many small interfaces and classes for what may be a simple choice.",
  ],
  confusedWith: [
    { name: "Factory Method", difference: "Factory Method makes one product and the choice is made by subclassing. Abstract Factory is an object that makes a whole family; its methods are often factory methods." },
    { name: "Builder", difference: "Builder builds one complex object step by step and returns it at the end. Abstract Factory returns several simple, related objects immediately." },
    { name: "Bridge", difference: "Bridge separates an abstraction from its implementation so both can vary; an abstract factory is often used to create the right implementation for a bridge." },
  ],
  solid:
    "Dependency Inversion (the client depends on CloudFactory and the product interfaces), Open/Closed (a new family is a new factory) and Single Responsibility (creation is separated from use).",
  interviewUses: [
    "UI theming systems (light and dark families).",
    "Payment-provider integration: each provider's payment, refund and auth clients.",
    "Repositories that support several databases.",
    "Game engines with per-platform renderers and input handlers.",
  ],
  examples: [
    {
      id: "theme",
      domain: "Mobile apps",
      title: "Light and dark themes",
      situation:
        "A food-delivery app supports light and dark mode. Screens were picking button and card styles one by one, and a dark card with a light button kept slipping through review.",
      roles: [
        { role: "Abstract factory", name: "ThemeFactory" },
        { role: "Concrete factory", name: "LightTheme, DarkTheme" },
        { role: "Abstract product", name: "Button, Card" },
        { role: "Concrete product", name: "LightButton, LightCard, DarkButton, DarkCard" },
        { role: "Client", name: "OrderScreen" },
      ],
      why: "A theme is a family: every widget on a screen must come from the same one. The screen asks one ThemeFactory for all its widgets, so a mismatch cannot happen.",
      goodToKnow:
        "Pick the factory once, at the edge of the app (from the user's setting), and pass it in. If screens choose the theme themselves, the pattern loses its point.",
      walkthrough: [
        "Asha prefers light mode, so the demo picks LightTheme for her.",
        "OrderScreen asks the factory for a card and a button and gets the light versions.",
        "draw() renders the order card and the Track button in matching light styles.",
        "Ravi prefers dark mode, so the same OrderScreen code receives DarkTheme.",
        "His screen shows the dark card and dark button, with no change to OrderScreen.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "payments",
      domain: "Fintech",
      title: "Payment and refund clients",
      situation:
        "A checkout service supports UPI and cards. Each provider has its own payment client and refund client, and a refund sent through the wrong provider's client fails in production.",
      roles: [
        { role: "Abstract factory", name: "ProviderFactory" },
        { role: "Concrete factory", name: "UpiProvider, CardProvider" },
        { role: "Abstract product", name: "PaymentClient, RefundClient" },
        { role: "Concrete product", name: "UpiPaymentClient, UpiRefundClient, CardPaymentClient, CardRefundClient" },
        { role: "Client", name: "Demo code" },
      ],
      why: "Payment and refund clients only work in pairs from the same provider. Getting both from one ProviderFactory makes the pair match by construction, and a small registry picks the factory from the payment method.",
      goodToKnow:
        "A registry with a fallback is handy, but log when the fallback is used. Silently treating an unknown method as UPI can hide a configuration mistake.",
      walkthrough: [
        "For \"upi\" the registry returns UpiProvider, whose payment client returns transaction UPI-750.",
        "The refund client from the same factory recognises the UPI id and refunds it to the bank account.",
        "For \"card\" the CardProvider family pays and refunds with CARD- ids.",
        "\"wallet\" is not registered, so provider_for() falls back to the UPI family.",
        "Every refund succeeds because each pair of clients came from one factory.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "database",
      domain: "Dev tools",
      title: "Database dialect and connection",
      situation:
        "A team runs tests on SQLite and production on MySQL. The two use different placeholders (? and %s) and different quoting, and a query built with SQLite rules but sent to MySQL breaks at runtime.",
      roles: [
        { role: "Abstract factory", name: "DatabaseFactory" },
        { role: "Concrete factory", name: "SqliteFactory, MySqlFactory" },
        { role: "Abstract product", name: "Dialect, Connection" },
        { role: "Concrete product", name: "SqliteDialect, SqliteConnection, MySqlDialect, MySqlConnection" },
        { role: "Client", name: "UserRepository" },
      ],
      why: "The SQL dialect and the connection must belong to the same database. UserRepository gets both from one factory, so the query it writes always suits the connection that runs it.",
      goodToKnow:
        "Factories that hold no state can be shared: a Scala object or a single module-level instance in Python is enough.",
      walkthrough: [
        "UserRepository receives the SQLite factory and creates a dialect and a connection from it.",
        "find_by_city() builds the SQL with the dialect: double-quoted names and a ? placeholder.",
        "The SQLite connection runs it with the parameter Kochi.",
        "With the MySQL factory the same method produces backtick quoting and a %s placeholder.",
        "The repository code is identical in both cases; only the factory passed in changed.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "board",
      domain: "Education",
      title: "Exam board report cards",
      situation:
        "A school platform serves CBSE and IB schools. Each board has its own grading scale and its own report card layout, and a report that graded with CBSE rules but printed in IB format made no sense.",
      roles: [
        { role: "Abstract factory", name: "BoardFactory" },
        { role: "Concrete factory", name: "CbseBoard, IbBoard" },
        { role: "Abstract product", name: "Grader, ReportCard" },
        { role: "Concrete product", name: "CbseGrader, CbseReportCard, IbGrader, IbReportCard" },
        { role: "Client", name: "Demo code" },
      ],
      why: "The grader and the report card are a family per board. The factory base class also holds make_report(), a shared recipe that always uses its own board's two products.",
      goodToKnow:
        "This mixes Abstract Factory with Template Method: make_report() is the fixed recipe and the creation methods are its steps. It works well when every family is used the same way.",
      walkthrough: [
        "Meena scored 94 in Maths, 78 in Science and 85 in English.",
        "CbseBoard.make_report() creates the CBSE grader and turns the marks into A1, B1 and A2.",
        "It then formats them with the CBSE report card.",
        "IbBoard runs the same make_report() with the IB grader, giving 6, 5 and 6 on the 1 to 7 scale.",
        "The IB report card lists the grades and adds them up to 17 points.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
