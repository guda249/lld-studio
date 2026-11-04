import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "thread-safe-singleton",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "Why can a lazily created singleton end up with two instances when threads race?",
      options: [
        "Checking for the instance and creating it are two separate steps, and another thread can run between them",
        "Python creates a new object every time a class attribute is read",
        "Each thread has its own copy of every class",
        "The garbage collector deletes the first instance while the second is created"
      ],
      answer: 0,
      hint: "Think of two people who both see an empty key box before either of them gets a copy cut.",
      explain: "The race is check-then-act: both threads see 'no instance yet', then both create one. Reading a class attribute does not create objects, classes are shared by all threads (only threading.local data is per thread), and nothing is garbage-collected while it is still referenced."
    },
    {
      type: "bug", tag: "Find the problem",
      prompt: "This Scala double-checked locking can hand another thread a half-built Cache. Tap the line that needs a fix.",
      code: { lang: "scala", text: `class Cache private ():
  val entries = loadEntries()

object Cache:
  private var instance: Cache = null
  private val lock = new Object

  def get(): Cache =
    if instance == null then
      lock.synchronized:
        if instance == null then
          instance = new Cache()
    instance` },
      answer: 5,
      hint: "The first check reads the field without holding the lock. What does the JVM promise about writes another thread made?",
      explain: "Line 5 needs @volatile. Without it, the JVM may let another thread see the reference before the constructor's writes, so the first check (outside the lock) can return a Cache whose entries are not set yet. The double check and the lock are otherwise correct. Simpler still: make Cache an object or use a lazy val."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "What does this Python code give you?",
      code: { lang: "python", text: `import threading

class Registry:
    _instance = None
    _lock = threading.Lock()

    @classmethod
    def get(cls) -> "Registry":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = Registry()
        return cls._instance` },
      options: [
        "A thread-safe singleton using double-checked locking",
        "A read-write lock around the registry",
        "A multiton with one instance per thread",
        "A producer-consumer queue"
      ],
      answer: 0,
      hint: "Count the checks of _instance and see where the lock is taken.",
      explain: "One check without the lock, a lock, and a second check inside it: double-checked locking for a lazily created singleton. There are no shared and exclusive modes (read-write lock), no per-thread or per-key instances (multiton), and no queue of work items."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A Scala service needs one shared HTTP client, created on first use and safe when many threads ask at once. What is the simplest correct choice?",
      options: [
        "Write double-checked locking with a @volatile var",
        "Put the client in an object (or a lazy val) and let the JVM initialise it once",
        "Synchronise every call to get the client",
        "Create a new client in each thread with ThreadLocal"
      ],
      answer: 1,
      hint: "What does the language already guarantee about an object's initialiser?",
      explain: "A Scala object is initialised once, lazily, under the JVM's class-initialisation lock; a lazy val gives the same guarantee for one field. Hand-written double-checked locking works but is easy to get wrong, synchronising every call costs a lock forever, and ThreadLocal gives one client per thread, not one shared client."
    },
    {
      type: "order", tag: "Put in order", prompt: "Thread 2 calls get() while Thread 1 is creating the instance (double-checked locking). Put Thread 2's steps in order.",
      steps: [
        "First check, without the lock: the instance is still missing",
        "Wait for the lock, which Thread 1 holds",
        "Get the lock after Thread 1 releases it",
        "Second check: the instance now exists, so create nothing",
        "Release the lock and return the shared instance"
      ],
      shuffled: [3, 1, 4, 0, 2],
      hint: "Thread 2 saw 'missing' before Thread 1 finished. The second check is what saves it.",
      explain: "Thread 2 passes the first check, then blocks on the lock. When it gets the lock, the second check finds Thread 1's instance, so it creates nothing, releases the lock and returns the same object."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which diagram shows a thread-safe lazy singleton with double-checked locking?",
      options: [
        {
          label: "DbPool has a public constructor; two threads each create their own DbPool.",
          width: 330, height: 200,
          nodes: [
            { id: "a", kind: "client", name: "Thread 1", at: { x: 8, y: 20, w: 100 } },
            { id: "b", kind: "client", name: "Thread 2", at: { x: 8, y: 120, w: 100 } },
            { id: "p", kind: "concrete", name: "DbPool", members: ["+ DbPool()"], at: { x: 180, y: 60, w: 140 } }
          ],
          edges: [
            { id: "e1", from: "a", to: "p", type: "composition" },
            { id: "e2", from: "b", to: "p", type: "composition" }
          ]
        },
        {
          label: "DbPool is a singleton holding a volatile instance field, a lock and get(); threads call get().",
          width: 330, height: 200,
          nodes: [
            { id: "t", kind: "client", name: "Threads", at: { x: 8, y: 40, w: 90 } },
            { id: "s", kind: "singleton", name: "DbPool", key: true,
              members: ["- volatile instance", "- lock", "+ get(): DbPool"], at: { x: 130, y: 20, w: 192 } }
          ],
          edges: [
            { id: "e1", from: "t", to: "s", type: "dependency" }
          ]
        },
        {
          label: "Threads put requests into a BlockingQueue and a single worker takes them.",
          width: 330, height: 200,
          nodes: [
            { id: "t", kind: "client", name: "Threads", at: { x: 8, y: 60, w: 84 } },
            { id: "q", kind: "concrete", name: "BlockingQueue", members: ["+ put(x)", "+ take()"], at: { x: 106, y: 50, w: 120 } },
            { id: "w", kind: "client", name: "Worker", at: { x: 240, y: 60, w: 84 } }
          ],
          edges: [
            { id: "e1", from: "t", to: "q", type: "dependency" },
            { id: "e2", from: "w", to: "q", type: "dependency" }
          ]
        }
      ],
      answer: 1,
      hint: "Look for a class that holds its own instance and a lock, and that every thread asks through one method.",
      explain: "B is right: DbPool keeps its own volatile instance and a lock, and get() hands out the one pool. In A each thread creates its own pool, which is the original race. C is a producer-consumer queue, not a singleton."
    }
  ],
  cards: [
    { id: "tss-intent", front: "Thread-safe Singleton: what is its intent, in one line?", back: "Create one shared instance lazily, exactly once, even when threads race to ask for it." },
    { id: "tss-vs-singleton", front: "Thread-safe Singleton vs the GoF Singleton: what is the difference?", back: "Singleton is the goal: one instance, one way to reach it. Thread-safe Singleton is the concurrency part: making the lazy creation correct when several threads arrive at once." },
    { id: "tss-solid", front: "Which SOLID principles does a hand-written thread-safe singleton strain, and what helps?", back: "Single Responsibility (it does its job, manages its lifetime and locks) and Dependency Inversion (callers grab a global). Let the language create it (module, object, lazy val) or build it at startup and inject it." },
    { id: "tss-spot", front: "Which pattern is hiding here?", code: { lang: "scala", text: "class Reports:\n  lazy val pool: DbPool = DbPool()\n  // first access builds it, once, even if threads race" }, back: "A thread-safe lazy singleton per Reports instance: Scala's lazy val is initialised exactly once, with the locking done for you." },
    { id: "tss-uml", front: "UML: how do you show a thread-safe singleton's guarded field?", back: "A «singleton» class with a private static instance field (underlined), a private lock field and a static get() operation. Note volatile on the field in a comment or as a property, such as {volatile}." },
    { id: "tss-when-not", front: "When do you NOT need double-checked locking?", back: "When eager creation is fine (module level, at startup), when the language does it (Scala object, lazy val), or when you inject one instance. And it never makes the singleton's own methods thread-safe." }
  ]
};

export default quiz;
