import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "read-write-lock",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What does a read-write lock allow that a plain lock (mutex) does not?",
      options: [
        "Many readers inside at the same time, while a writer still gets the data to itself",
        "Many writers inside at the same time, as long as no reader is inside",
        "A reader to change the data without waiting",
        "Threads to skip locking entirely when the data is small"
      ],
      answer: 0,
      hint: "Think of the museum gallery: who may be in the room together, and who must be alone?",
      explain: "Readers share the read mode; a writer takes the exclusive write mode and is alone. Writers never share with each other, readers must not change data, and skipping the lock is a different idea (a copy-on-write snapshot)."
    },
    {
      type: "bug", tag: "Find the problem",
      prompt: "This cache sometimes calls the slow loader twice for the same key. Tap the line that should check the cache again.",
      code: { lang: "python", text: `def get(self, key: str) -> str:
    self._lock.acquire_read()
    try:
        value = self._data.get(key)
    finally:
        self._lock.release_read()
    if value is not None:
        return value
    self._lock.acquire_write()
    try:
        value = self._load(key)
        self._data[key] = value
        return value
    finally:
        self._lock.release_write()` },
      answer: 11,
      hint: "Between releasing the read lock and getting the write lock, another thread may have filled the cache.",
      explain: "Line 11 loads straight away. Two threads can both see the miss, then take the write lock one after the other, and both load. Check self._data again under the write lock before calling _load. The other lines are correct: the read lock is released in finally, and a read lock cannot be upgraded in place."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which concurrency pattern does this Scala code use?",
      code: { lang: "scala", text: `import java.util.concurrent.locks.ReentrantReadWriteLock

class RouteTable:
  private val rw = ReentrantReadWriteLock()
  private var routes = Map("/api" -> "10.0.0.5")

  def lookup(path: String): Option[String] =
    rw.readLock().lock()
    try routes.get(path) finally rw.readLock().unlock()

  def replace(fresh: Map[String, String]): Unit =
    rw.writeLock().lock()
    try routes = fresh finally rw.writeLock().unlock()` },
      options: ["Producer–Consumer", "Read–Write Lock", "Thread-safe Singleton", "Proxy"],
      answer: 1,
      hint: "Look at the two different locks taken by lookup and replace.",
      explain: "Lookups share the read lock and replace takes the exclusive write lock: Read–Write Lock. There is no queue between producer and consumer threads, nothing is created once lazily (Singleton), and no stand-in object controls access to another (Proxy)."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A Python service keeps a small dict of 20 feature flags. Requests read one flag each (a single dict lookup); an admin changes a flag about once a day. What is the best choice?",
      options: [
        "A writer-first read-write lock around every lookup",
        "An immutable snapshot that the admin replaces in one assignment; readers take no lock",
        "One thread per request, each with its own copy of the flags read from disk",
        "A fair ReentrantReadWriteLock-style lock with a waiting queue"
      ],
      answer: 1,
      hint: "Reads are tiny and writes are rare. What does the lock's bookkeeping cost compared with the read itself?",
      explain: "For small, rarely changed data, copy-on-write wins: readers grab the current reference and never wait, and the admin swaps in a new dict in one step. A read-write lock costs more than a one-line lookup and the GIL already stops the reads from running in parallel. Per-request copies from disk are slow and can disagree."
    },
    {
      type: "order", tag: "Put in order", prompt: "A writer-first read-write lock: put what happens in order when a writer arrives while two readers are inside.",
      steps: [
        "The writer adds itself to writers_waiting and waits",
        "A new reader arrives and waits, because a writer is queued",
        "The two readers finish and the reader count drops to 0",
        "The writer enters alone and changes the data",
        "The writer leaves and wakes everyone; the waiting reader enters"
      ],
      shuffled: [2, 4, 0, 3, 1],
      hint: "The writer queues first, and the room must empty before it can enter.",
      explain: "The writer registers as waiting, which closes the door to new readers. The readers already inside finish, the count hits 0, the writer works alone, and on release it wakes the waiting reader."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which diagram shows a resource guarded by a read-write lock?",
      options: [
        {
          label: "Cache holds a Lock with one acquire and one release method; Reader and Writer both use Cache.",
          width: 330, height: 200,
          nodes: [
            { id: "r", kind: "client", name: "Reader", at: { x: 8, y: 20, w: 90 } },
            { id: "w", kind: "client", name: "Writer", at: { x: 8, y: 130, w: 90 } },
            { id: "c", kind: "concrete", name: "Cache", members: ["- lock: Lock", "+ get(k)"], at: { x: 150, y: 60, w: 170 } }
          ],
          edges: [
            { id: "e1", from: "r", to: "c", type: "dependency" },
            { id: "e2", from: "w", to: "c", type: "dependency" }
          ]
        },
        {
          label: "Cache owns a ReadWriteLock with read and write modes; readers and a writer use Cache.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "concrete", name: "Cache", key: true, members: ["+ get(k)", "+ put(k, v)"], at: { x: 8, y: 20, w: 130 } },
            { id: "l", kind: "concrete", name: "ReadWriteLock", key: true, members: ["- readers: int", "+ read()", "+ write()"], at: { x: 170, y: 20, w: 152 } },
            { id: "u", kind: "client", name: "Readers, Writer", at: { x: 8, y: 140, w: 140 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "l", type: "composition" },
            { id: "e2", from: "u", to: "c", type: "dependency" }
          ]
        },
        {
          label: "Producer puts items into a BlockingQueue and Consumer takes them.",
          width: 330, height: 200,
          nodes: [
            { id: "p", kind: "client", name: "Producer", at: { x: 8, y: 60, w: 96 } },
            { id: "q", kind: "concrete", name: "BlockingQueue", members: ["+ put(x)", "+ take()"], at: { x: 116, y: 50, w: 120 } },
            { id: "k", kind: "client", name: "Consumer", at: { x: 246, y: 60, w: 78 } }
          ],
          edges: [
            { id: "e1", from: "p", to: "q", type: "dependency" },
            { id: "e2", from: "k", to: "q", type: "dependency" }
          ]
        }
      ],
      answer: 1,
      hint: "Look for a lock with two separate modes, one for reading and one for writing.",
      explain: "B is right: Cache owns a ReadWriteLock with read() and write(). A uses one plain Lock for everyone, the original problem where readers queue behind readers. C is Producer–Consumer: threads hand items through a queue."
    }
  ],
  cards: [
    { id: "rw-intent", front: "Read–Write Lock: what is its intent, in one line?", back: "Let many readers in at once, but give a writer the data to itself." },
    { id: "rw-vs-mutex", front: "Read–Write Lock vs a plain mutex: what is the difference?", back: "A mutex admits exactly one thread, reader or writer. A read-write lock admits many readers together and makes only writers exclusive. It pays off only when reads are many and slow." },
    { id: "rw-solid", front: "Which design principle keeps a read-write lock safe to use?", back: "Encapsulation and Single Responsibility: the resource class (PriceCatalog) takes the right lock inside each method, so callers can never forget it, and the lock policy lives in one place." },
    { id: "rw-spot", front: "Which pattern is hiding here?", code: { lang: "python", text: "with table.lock.read():\n    route = table.routes[path]\n...\nwith table.lock.write():\n    table.routes = fresh" }, back: "Read–Write Lock: lookups share the read mode, the rebuild takes the exclusive write mode." },
    { id: "rw-uml", front: "UML: how do you show that PriceCatalog creates and owns its lock?", back: "A composition line with a filled diamond at PriceCatalog (the whole) pointing to ReadWriteLock (the part). The lock lives and dies with the catalog." },
    { id: "rw-when-not", front: "When should you NOT use a read-write lock?", back: "When reads are tiny, writes are frequent, or the data fits in an immutable snapshot you can swap. In CPU-heavy Python, the GIL stops readers from running in parallel anyway." }
  ]
};

export default quiz;
