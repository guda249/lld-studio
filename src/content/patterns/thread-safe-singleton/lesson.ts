import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-model.py?raw";
import ex1Scala from "./code/ex1-model.scala?raw";
import ex2Py from "./code/ex2-pincodes.py?raw";
import ex2Scala from "./code/ex2-pincodes.scala?raw";
import ex3Py from "./code/ex3-regions.py?raw";
import ex3Scala from "./code/ex3-regions.scala?raw";
import ex4Py from "./code/ex4-seats.py?raw";
import ex4Scala from "./code/ex4-seats.scala?raw";

const lesson: PatternLesson = {
  slug: "thread-safe-singleton",
  analogy:
    "One spare key to the office, kept in a box. The first person to arrive opens the office. If two people both see the box is full, walk off, and each get a copy cut, there are now two keys. The fix: whoever takes the box holds it, looks inside again, and only then acts.",
  problem: {
    text: "The Singleton lesson showed the goal: one shared instance, created on first use. This lesson is about the moment of creation when several threads arrive together. The naive get() checks \"is there an instance yet?\" and then creates one. Those are two separate steps. If a thread switch lands between them, two threads both see None, and both create a DbPool: 20 database connections instead of 10, and one pool lost but still open. The demo forces that unlucky switch with a barrier, so it happens every time.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Make the check and the create one step for everyone, without paying for a lock forever. Double-checked locking does this: check without the lock (the fast path once the instance exists), and only if it is missing take the lock and check again, because another thread may have created it while we waited. On the JVM the field must also be @volatile, so no thread can see a reference to a pool that is not fully built yet. Often you need none of this: a Python module-level instance is created once under the import lock, and a Scala object or lazy val is created once, lazily and thread-safely, by the language itself.",
  participants: [
    { role: "Singleton", name: "DbPool", kind: "singleton", description: "Holds the one instance and controls its creation (the same role as in the GoF Singleton)." },
    { role: "Creation lock", name: "_lock (Python Lock), lock.synchronized (Scala)", kind: "concrete", description: "Lets one thread at a time run the second check and the creation." },
    { role: "Instance field", name: "_instance / @volatile instance", kind: "concrete", description: "Read without the lock on the fast path. On the JVM it must be volatile so readers see a fully built object." },
    { role: "Client threads", name: "Request threads calling DbPool.get()", kind: "client", description: "May all arrive at the same moment; each must end up with the same pool." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "Let the language do the locking. In Python, put the instance at module level (pool = DbPool() in db.py): a module's code runs once, under the import lock, so every thread that imports it gets the same object. It is created at import rather than on first use, which is usually fine. In Scala, an object is the lazy-holder idiom built in: the JVM runs its initialiser once, on first use, and makes other threads wait for it. A lazy val inside a class gives the same guarantee for one field.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Java's \"initialisation-on-demand holder\" idiom and enum singletons; Scala objects compile to exactly this kind of lazily initialised holder.",
    "Scala 3 lazy val: initialised once, thread-safe, without you writing a lock.",
    "Python's import system: a module is executed once and cached in sys.modules, guarded by the import lock.",
    "Java's ConcurrentHashMap.computeIfAbsent and Python logging.getLogger(name): one instance per key, created safely under a lock.",
  ],
  whenToUse: [
    "You really need lazy creation (the object is expensive and may never be needed) and several threads may ask for it at the same moment.",
    "Creating it twice would be harmful, not just wasteful: two connection pools, two model copies in memory, two counters handing out the same number.",
    "You need one instance per key (per region, per tenant) created on demand: the same check-then-create race applies to every key.",
  ],
  whenNotToUse: [
    "When eager creation is fine: build it at startup or at module level, before any threads start, and the race disappears.",
    "In Scala, instead of hand-written double-checked locking: use an object or a lazy val.",
    "When you could create the object in one place and pass it in (dependency injection): one instance, no global, no locking puzzle.",
    "As a fix for thread safety of the object's own methods. A safely created singleton can still have racy methods.",
  ],
  pros: [
    "Exactly one instance even when threads race, so no doubled connections, memory or side effects.",
    "Double-checked locking takes the lock only during creation; every later call is a plain read.",
    "The language-level versions (module, object, lazy val) need no code from you at all.",
  ],
  cons: [
    "Double-checked locking is easy to get subtly wrong: forget the second check and you create twice; forget @volatile on the JVM and another thread may see a half-built object.",
    "It only protects creation. Shared mutable state inside the singleton still needs its own lock or atomic.",
    "All the costs of the Singleton itself remain: hidden global state, harder testing, one per process only.",
  ],
  confusedWith: [
    { name: "Singleton (GoF)", difference: "Singleton is the design goal: one instance and one way to reach it. Thread-safe Singleton is the concurrency part: making the lazy creation correct when threads race." },
    { name: "Synchronising every call", difference: "Taking the lock on every get() is also correct, but every caller pays for it forever. Double-checked locking pays only during creation." },
    { name: "Thread-local instance", difference: "threading.local / ThreadLocal gives one instance per thread, not one per process. Useful for non-thread-safe objects, but it is the opposite of sharing." },
  ],
  solid:
    "Single Responsibility is the tension here: the class does its real job and also manages its own creation and locking. The idiomatic versions move creation out to the language (module, object, lazy val) or to the composition root that injects the instance, which also restores Dependency Inversion.",
  interviewUses: [
    "\"Make this Singleton thread-safe\": walk through the race, then double-checked locking, then why the field needs volatile in Java.",
    "\"What is the simplest thread-safe Singleton in Java?\": an enum or the lazy holder class; in Scala, an object.",
    "Logger, configuration or connection-pool managers in LLD rounds, with follow-ups on testability.",
    "Follow-up: \"Is the singleton's counter thread-safe now?\" No: creation and methods are separate problems.",
  ],
  examples: [
    {
      id: "model",
      domain: "Machine learning",
      title: "Loading a fraud model once",
      situation:
        "A payments service scores every transaction with a 900 MB fraud-detection model. Loading it takes seconds and a lot of memory. At startup, four request threads may ask for it in the same instant.",
      roles: [
        { role: "Singleton holder", name: "ModelLoader (NoLock / AlwaysLock / DoubleChecked)" },
        { role: "Expensive instance", name: "FraudModel" },
        { role: "Client threads", name: "request threads calling get()" },
      ],
      why: "Loading twice wastes seconds and doubles memory. The three loaders show the trade-off: no lock is wrong, a lock on every call is correct but slow forever, double-checked locking is correct and only locks while loading.",
      goodToKnow:
        "In CPython the GIL makes the single assignment of _model atomic, so double-checked locking is safe there. On the JVM it is only safe with a @volatile field (or final fields inside the object).",
      walkthrough: [
        "Four request threads ask the loader for the model at the same moment.",
        "With no lock, all four see that nothing is loaded yet, and the model is loaded four times.",
        "Locking every call loads it once, but 100 later calls also take the lock: 104 in total.",
        "Double-checked locking loads it once and takes the lock only for the 4 racing calls.",
        "Every later call finds the model on the fast path, with no lock at all.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "pincodes",
      domain: "Logistics",
      title: "Pincode directory: eager or lazy?",
      situation:
        "A courier app maps 19,000 Indian pincodes to cities to route parcels. Building the directory is slow. Some app instances (the admin console) never route a parcel at all.",
      roles: [
        { role: "Eager singleton", name: "EagerServices.directory (module-level / val)" },
        { role: "Lazy singleton", name: "LazyServices.directory (double-checked / lazy val)" },
        { role: "Shared instance", name: "PincodeDirectory" },
        { role: "Client threads", name: "parcel-routing threads" },
      ],
      why: "Eager creation is the simplest thread-safe singleton: it exists before any thread asks. Lazy creation saves the cost when it is never used, and in Scala a lazy val gives it to you with thread safety included.",
      goodToKnow:
        "Python's functools.cached_property stopped locking in Python 3.12, so racing threads can run the getter twice. Use an explicit lock, as LazyServices does, when that matters.",
      walkthrough: [
        "With eager services, the directory is loaded at startup, before the app is ready.",
        "Four routing threads then use it; nothing is loaded again.",
        "With lazy services, nothing is loaded at startup.",
        "The first routing thread triggers the load, exactly once, even with four threads racing.",
        "On a day with no parcels, the lazy directory is never loaded, while the eager one was built for nothing.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "regions",
      domain: "Cloud",
      title: "One client per region",
      situation:
        "A storage service talks to cloud regions such as Mumbai (ap-south-1) and Frankfurt (eu-central-1). Each RegionClient opens its own connection pool and fetches credentials, so the service wants exactly one per region, created when first needed.",
      roles: [
        { role: "Multiton registry", name: "RacyRegistry / SafeRegistry" },
        { role: "One instance per key", name: "RegionClient" },
        { role: "Client threads", name: "upload requests" },
      ],
      why: "A per-key singleton has the same check-then-create race for every key. Doing the check and the create under one lock (or with computeIfAbsent in Scala) creates exactly one client per region.",
      goodToKnow:
        "A thread-safe map is not enough on its own: containsKey then put is still two steps. And Python's dict.setdefault(key, RegionClient(key)) builds a new client on every call, even when one exists.",
      walkthrough: [
        "Four upload requests for Mumbai arrive at the same moment.",
        "In the racy registry all four see no Mumbai client, and four clients are created.",
        "In the safe registry the check and the create happen together, so only one client is created.",
        "With two Mumbai and two Frankfurt requests, the safe registry creates exactly two clients.",
        "Every later request for a region gets the same client back.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "seats",
      domain: "Entertainment",
      title: "Safe to create, not safe to use",
      situation:
        "A cinema booking site has one SeatCounter per show that hands out seat numbers. Its creation is thread-safe (double-checked locking in Python, an object in Scala). On opening night, bookings arrive together and several customers get the same seat.",
      roles: [
        { role: "Singleton (safely created)", name: "SeatCounter" },
        { role: "Racy method", name: "next_seat_unlocked / nextSeatUnlocked" },
        { role: "Safe method", name: "next_seat_locked / nextSeatLocked" },
        { role: "Client threads", name: "booking threads" },
      ],
      why: "This is the most common thread-safe singleton bug: creation is guarded, but the shared counter inside is read and written in two steps. The method needs its own lock (or an AtomicInteger in Scala).",
      goodToKnow:
        "Read-modify-write (x = x + 1) is never atomic across threads, even in CPython with the GIL, because a switch can land between the read and the write.",
      walkthrough: [
        "Every booking thread gets the same SeatCounter, so creation is fine.",
        "Four bookings call next_seat at the same moment.",
        "Without a lock, all four read 0 before anyone writes.",
        "All four write 1: every customer gets seat 1.",
        "With the lock (or AtomicInteger), the seats are 1 to 4.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
