import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-awb.py?raw";
import ex1Scala from "./code/ex1-awb.scala?raw";
import ex2Py from "./code/ex2-metrics.py?raw";
import ex2Scala from "./code/ex2-metrics.scala?raw";
import ex3Py from "./code/ex3-limit.py?raw";
import ex3Scala from "./code/ex3-limit.scala?raw";
import ex4Py from "./code/ex4-flags.py?raw";
import ex4Scala from "./code/ex4-flags.scala?raw";

const lesson: PatternLesson = {
  slug: "singleton",
  analogy:
    "An airport has one control tower. Every pilot talks to the same tower; two towers giving different instructions would be dangerous.",
  problem: {
    text: "Two services each create their own AppConfig, and each one reads the config file again. If the file changes in between, the upload service and the download service end up with different limits, and the file is read more often than needed. Some things must be shared and consistent: configuration, a connection pool, a hardware driver.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "The class controls its own creation. Creating it again does not build a new object; it hands back the one that already exists. In Python, __new__ checks a class attribute and uses a lock with a double check, so two threads cannot create two copies. In Scala, an object is a singleton by the language: it is created once, lazily on first use, and the JVM makes that creation thread-safe.",
  participants: [
    { role: "Singleton", name: "AppConfig", kind: "singleton", description: "Holds the only instance, guards its creation and gives access to it." },
    { role: "Client", name: "ReportService, BillingService", kind: "client", description: "Ask for AppConfig whenever they need it and always get the same object." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "In Scala, an object is already a singleton, so no pattern code is needed. In Python, a module runs only once, so a module-level instance (settings = Settings()) is the usual singleton. Better still for testing: create the one instance at startup (the composition root) and pass it to the classes that need it. You still have one instance, but no hidden global, and a test can pass its own.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Python's None, True and False are single objects; logging.getLogger(name) returns the same logger for the same name.",
    "Spring beans are singleton-scoped by default (one per application context, handed out by injection).",
    "Scala objects and companion objects.",
    "Connection pools, caches, device drivers and metrics registries.",
  ],
  whenToUse: [
    "There must be exactly one instance for correctness, such as one connection pool or one handle to a hardware device.",
    "The object is expensive to create and is shared by the whole program.",
  ],
  whenNotToUse: [
    "Just to avoid passing an argument. That is a global variable with extra steps.",
    "When tests need different instances or isolated state.",
    "In distributed systems: a singleton is one per process, not one per cluster. Two servers have two of them.",
  ],
  pros: [
    "Only one instance is ever created, and only when it is first needed.",
    "Every part of the program sees the same, consistent state.",
  ],
  cons: [
    "Hidden global state and hidden dependencies: you cannot tell from a class's constructor that it uses the singleton.",
    "Hard to replace with a fake in tests, and state leaks from one test into the next.",
    "Breaks Single Responsibility: the class manages its own lifetime as well as doing its job.",
    "Needs care with threads (the Python lock) and does not mix well with subclassing.",
  ],
  confusedWith: [
    { name: "Static utility class", difference: "A module of plain functions has no instance and usually no state. A singleton is a real object with state." },
    { name: "Flyweight", difference: "Flyweight shares many instances, one per distinct shared value; Singleton has exactly one." },
    { name: "Multiton (registry)", difference: "One instance per key rather than one in total, as in logging.getLogger(name)." },
  ],
  solid:
    "Calling the singleton directly from business code often breaks Dependency Inversion, because the class depends on a concrete global. Creating the one instance at startup and injecting it fixes this, and keeps the class testable.",
  interviewUses: [
    "Parking lot with one ParkingLot instance.",
    "Logger and configuration manager.",
    "ID or ticket-number generator.",
    "Rate-limiter registry. Expect follow-up questions on thread safety (double-checked locking) and testability (injection).",
  ],
  examples: [
    {
      id: "awb",
      domain: "Logistics",
      title: "Airway bill numbers",
      situation:
        "A courier company's hubs print airway bill (AWB) numbers for parcels. If two generators exist in one process, two parcels can get the same number and get lost in sorting.",
      roles: [
        { role: "Singleton", name: "AwbGenerator" },
        { role: "Client", name: "hub_worker" },
      ],
      why: "Uniqueness depends on one shared counter. A single generator guarantees that every caller moves the same counter forward.",
      goodToKnow:
        "Making the creation thread-safe is not enough: next_awb also needs a lock (or an AtomicLong in Scala), because many threads call it at once. And it is one per process only: several servers would need a database sequence instead.",
      walkthrough: [
        "Four hub workers (Bengaluru, Delhi, Mumbai and Hyderabad) each ask for 250 AWB numbers.",
        "Each call to AwbGenerator() returns the same object, so they all share one counter.",
        "A lock (AtomicLong in Scala) makes each increment safe, so all 1000 numbers are unique.",
        "The next parcel from Chennai gets number 1001.",
        "The last line confirms that every call returned the same generator.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "metrics",
      domain: "Observability",
      title: "Metrics counters",
      situation:
        "A web app counts requests, failed logins and search results from many modules. Each module needs to update the same counter for a metric without passing counter objects around.",
      roles: [
        { role: "Multiton registry", name: "Counter.named" },
        { role: "Shared instance", name: "Counter" },
        { role: "Client", name: "handle_login, handle_search" },
      ],
      why: "This is the multiton flavour: one instance per name, the same idea as logging.getLogger(name). Every call with the same name returns the same counter.",
      goodToKnow:
        "A registry like this grows forever and is shared by every test. Real metrics libraries let you reset or create a separate registry for tests.",
      walkthrough: [
        "handle_login is called twice; one login fails.",
        "handle_search is called twice, with 12 results and then 0.",
        "Each handler asks Counter.named for its metric and gets the shared counter for that name.",
        "Asking twice for http_requests returns the very same object.",
        "The report shows 4 requests, 1 login failure and 12 search results.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "limit",
      domain: "Fintech",
      title: "UPI daily limit, injected",
      situation:
        "A payments app caps how much a user can send per day across UPI transfers and bill payments. Both services must see the same running total, and tests must not share it.",
      roles: [
        { role: "Single shared instance", name: "DailyLimit" },
        { role: "Composition root", name: "build_app" },
        { role: "Client", name: "UpiTransferService, BillPayService" },
      ],
      why: "This is the safer alternative to a classic singleton. One DailyLimit is created at startup and passed to both services, so there is one shared total, but no global and no special creation code.",
      goodToKnow:
        "Each constructor now shows its dependency, so a test simply passes a small DailyLimit of its own. Most real projects prefer this to a hand-written singleton.",
      walkthrough: [
        "build_app creates one DailyLimit of ₹1,00,000 and hands it to both services.",
        "Asha sends ₹60,000 by UPI, which is allowed.",
        "She pays a ₹30,000 BESCOM bill through the other service, which uses the same total.",
        "A further ₹20,000 UPI transfer is blocked because the shared total would pass the cap.",
        "A test builds its own ₹500 limit, so nothing global needs resetting.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "flags",
      domain: "Education",
      title: "Feature flags and the test trap",
      situation:
        "An online exam platform switches features such as webcam proctoring and extra time on and off. The flags live in one module-level object that every service reads.",
      roles: [
        { role: "Singleton (module-level object)", name: "FeatureFlags" },
        { role: "Client", name: "start_exam" },
      ],
      why: "A module-level object (a Scala object) is the lightest singleton: no locks or __new__, and every import sees the same flags.",
      goodToKnow:
        "This example shows the main downside: global mutable state. One test switches a flag on and forgets to switch it off, and the next test fails for no visible reason. Prefer injecting the flags, or reset them after every test.",
      walkthrough: [
        "Ravi starts an exam; only live proctoring is on.",
        "The first test enables extra_time and forgets to disable it.",
        "The second test expects a normal exam but also gets extra time.",
        "The state leaked because both tests share the one flags object.",
        "Only after a manual reset does the exam start normally again.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
