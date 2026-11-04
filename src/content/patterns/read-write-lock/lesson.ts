import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-rates.py?raw";
import ex1Scala from "./code/ex1-rates.scala?raw";
import ex2Py from "./code/ex2-leaderboard.py?raw";
import ex2Scala from "./code/ex2-leaderboard.scala?raw";
import ex3Py from "./code/ex3-fares.py?raw";
import ex3Scala from "./code/ex3-fares.scala?raw";
import ex4Py from "./code/ex4-chart.py?raw";
import ex4Scala from "./code/ex4-chart.scala?raw";

const lesson: PatternLesson = {
  slug: "read-write-lock",
  analogy:
    "A museum gallery. Any number of visitors can look at a painting at the same time; looking changes nothing. When the restorer comes to retouch it, the guard lets the visitors inside finish, stops new ones at the door, and the restorer works alone. Then the door opens again.",
  problem: {
    text: "A shop's PriceCatalog guards its prices with one plain lock. That keeps the sale job from changing a price while someone reads it, but it also makes every shopper wait for every other shopper, even though reading never changes anything. Four shoppers quoting their carts go in one at a time: the peak number of readers inside is 1. With slow reads (a database call, a long report), the queue grows with every user, and the CPU sits idle while threads wait.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Use a lock with two modes. The read (shared) mode lets any number of readers in together. The write (exclusive) mode waits until the room is empty, then lets one writer in alone; nobody reads while it writes. Python has no built-in read-write lock, so ReadWriteLock builds one from a Condition: it counts readers, remembers whether someone is writing, and counts waiting writers, so new readers queue behind a waiting writer and the writer never starves. Scala uses java.util.concurrent's ReentrantReadWriteLock: readLock() and writeLock(), always unlocked in finally.",
  participants: [
    { role: "Read-write lock", name: "ReadWriteLock (Python), ReentrantReadWriteLock (Scala)", kind: "concrete", description: "Has a shared read mode and an exclusive write mode, and decides who may enter now and who waits." },
    { role: "Shared resource", name: "PriceCatalog", kind: "concrete", description: "Holds the data. Wraps every read in the read lock and every change in the write lock, so callers never touch the lock." },
    { role: "Readers", name: "Shopper threads (quote)", kind: "client", description: "Look at the data without changing it. Many can be inside at once." },
    { role: "Writer", name: "Sale job (set_price / setPrice)", kind: "client", description: "Changes the data. Waits until no reader is inside, then works alone." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "For read-mostly data, you often need no read lock at all. Keep the data in an immutable snapshot (a frozen dict / an immutable Map) and let a writer build a new snapshot and swap the reference in one step. Readers just grab the current reference: they never wait and always see a whole, consistent version. In Python one attribute assignment is atomic; in Scala an AtomicReference does the swap. Use a real read-write lock when the data is too big to copy on every write, or writes are frequent.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Java and Scala: java.util.concurrent.locks.ReentrantReadWriteLock, and StampedLock for an optimistic read that takes no lock at all.",
    "Databases: shared (S) and exclusive (X) row and table locks work the same way; many readers, one writer.",
    "Operating systems: Linux rwlock_t and rw_semaphore, POSIX pthread_rwlock_t, Rust's std::sync::RwLock, Go's sync.RWMutex.",
    "Caches and routing tables in servers: read on every request, rebuilt now and then.",
  ],
  whenToUse: [
    "Reads far outnumber writes (say 10 to 1 or more), as in caches, configuration, price lists and routing tables.",
    "Each read takes a while (it walks a big structure or waits on I/O while holding the data), so letting readers overlap saves real time.",
    "Readers need a consistent view of several fields at once, so a lock-free read of one field is not enough.",
  ],
  whenNotToUse: [
    "Reads are tiny (one dictionary lookup). The extra bookkeeping costs more than a plain Lock, which is simpler and often faster.",
    "Writes are frequent. Readers and writers keep taking turns, and you get the cost of the fancy lock with none of the sharing.",
    "The data can live in an immutable snapshot that is swapped on write: readers then need no lock at all.",
    "In CPU-heavy Python code: the GIL lets only one thread run Python code at a time, so readers overlap only while they wait (I/O, sleep, a C library that releases the GIL).",
  ],
  pros: [
    "Many readers work at the same time, so read-heavy workloads stop queuing behind each other.",
    "Writers still get the data to themselves, so readers never see a half-done change.",
    "The rule is easy to say and to test: many readers, or one writer.",
  ],
  cons: [
    "More complex and slower per call than a plain lock; it only pays off when reads are many and slow enough.",
    "Starvation: with reader preference a writer can wait forever; with writer preference readers can. You must pick a policy.",
    "You cannot upgrade a read lock to a write lock in place. Trying to (in Scala, locking the write lock while holding the read lock) deadlocks; you must release, take the write lock and check again.",
    "Easy to misuse: forget to unlock in finally, or change data while holding only the read lock, and the bug shows up rarely and far away.",
  ],
  confusedWith: [
    { name: "Mutex (plain Lock)", difference: "A mutex lets exactly one thread in, reader or writer. A read-write lock lets many readers in together and only makes writers exclusive." },
    { name: "Proxy", difference: "A protection proxy also sits in front of an object and checks each call, but it decides who may call at all. A read-write lock decides when callers may run, based on whether they read or write." },
    { name: "Copy-on-write snapshot", difference: "Readers take no lock; writers copy the data and swap in a new version. Great for small, rarely changed data; a read-write lock suits big or frequently updated data." },
  ],
  solid:
    "Single Responsibility and encapsulation: PriceCatalog owns its locking, so callers just call quote() and set_price() and cannot forget the lock. The lock policy (reader-first or writer-first) lives in one class, and changing it does not touch any caller.",
  interviewUses: [
    "In-memory cache or key-value store: get() under the read lock, put() under the write lock; expect questions on writer starvation.",
    "Configuration or feature-flag service that reloads now and then while every request reads it.",
    "Stock price board or leaderboard: many viewers, one updater.",
    "Follow-ups: how to avoid writer starvation (writer preference, a fair lock), why you cannot upgrade a read lock, and when copy-on-write is the better answer.",
  ],
  examples: [
    {
      id: "rates",
      domain: "Fintech",
      title: "Who may enter the rate board?",
      situation:
        "A payment gateway converts every foreign card payment with the latest exchange rates. Thousands of payment threads read the RateBoard each second; a rate feed updates it once a minute. The team needs to know exactly when a payment waits and when the feed waits.",
      roles: [
        { role: "Read-write lock", name: "ReadWriteLock / ReentrantReadWriteLock" },
        { role: "Shared resource", name: "RateBoard" },
        { role: "Reader", name: "payment thread" },
        { role: "Writer", name: "rate feed" },
      ],
      why: "Reads vastly outnumber writes and must see a consistent set of rates. The demo checks every case of the rule by trying to enter without waiting.",
      goodToKnow:
        "In Scala, readLock().tryLock() with no arguments barges past a queued writer. tryLock(0, MILLISECONDS) respects the queue, which is what the demo uses.",
      walkthrough: [
        "With nobody inside, a payment or the rate feed enters at once.",
        "With two payments reading, a third payment joins them: three readers inside together.",
        "The rate feed, though, must wait for those two readers to leave.",
        "While the feed is writing, everyone else waits, readers and writers alike.",
        "Once the feed is queued, new payments wait too, so the feed is never starved.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "leaderboard",
      domain: "Gaming",
      title: "Leaderboard: reader-first or writer-first?",
      situation:
        "A mobile game shows a live leaderboard. Players view it constantly, and a score updater writes new scores. In testing, Priya's new high score sometimes appears minutes late during busy hours.",
      roles: [
        { role: "Read-write lock (with a policy)", name: "ReadWriteLock" },
        { role: "Shared resource", name: "Leaderboard" },
        { role: "Readers", name: "viewing players" },
        { role: "Writer", name: "score updater (update)" },
      ],
      why: "The policy decides who goes first when a writer is waiting. A reader-first lock keeps letting new viewers in, so the updater can starve; a writer-first lock closes the door to new readers until the update is done.",
      goodToKnow:
        "Writer-first can starve readers instead if writes never stop. Java's ReentrantReadWriteLock(true) is a fair lock: everyone is served in arrival order, at some cost in speed.",
      walkthrough: [
        "Two players are viewing the leaderboard.",
        "The score updater arrives to write Priya's 9,100 and has to wait for them.",
        "With reader-first, new viewers keep walking in past the waiting updater.",
        "With writer-first, new viewers wait at the door, so the updater goes next.",
        "When the readers leave, the updater writes alone and the new score appears.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "fares",
      domain: "Travel",
      title: "Fare cache: check again after the write lock",
      situation:
        "A travel site caches flight fares. Searches read the cache under the read lock. On a miss, the fare comes from the airline's API, which is slow and charged per call. At 9 am, four searches for Bengaluru to Delhi miss at the same moment.",
      roles: [
        { role: "Read-write lock", name: "ReadWriteLock / ReentrantReadWriteLock" },
        { role: "Shared resource", name: "FareCache" },
        { role: "Readers that may become writers", name: "search threads (fare)" },
      ],
      why: "A read lock cannot be upgraded. Each search must let go of the read lock and take the write lock, and by then another search may have filled the cache. Checking again under the write lock means only the first one calls the airline.",
      goodToKnow:
        "This is the same check-then-act trap as double-checked locking in a thread-safe singleton. In Scala you may downgrade (take the read lock while holding the write lock, then release the write lock), but never upgrade.",
      walkthrough: [
        "Four searches read the cache together and all see a miss.",
        "Each releases its read lock and queues for the write lock.",
        "The first one in calls the airline and stores ₹5,400.",
        "The others check again under the write lock, find the fare and skip the call.",
        "Without that second check, the airline is called four times for the same fare.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "chart",
      domain: "Healthcare",
      title: "Patient chart: no torn readings",
      situation:
        "A hospital's ward screens show each patient's blood pressure, read many times a second. A nurse records a new reading, which changes two fields: systolic and diastolic. A screen that reads in between could show a pressure that was never measured.",
      roles: [
        { role: "Read-write lock", name: "ReadWriteLock / ReentrantReadWriteLock" },
        { role: "Shared resource", name: "PatientChart" },
        { role: "Reader", name: "doctor's screen" },
        { role: "Writer", name: "nurse (record_bp)" },
      ],
      why: "Reads need a consistent view of two fields at once. The write lock makes the two-field update all-or-nothing for readers, while screens still read together.",
      goodToKnow:
        "In Python one attribute read is atomic, but two reads in a row are not. If the reading were one immutable object (a tuple or case class) swapped in one step, no read lock would be needed.",
      walkthrough: [
        "The chart shows 120/80, and any number of screens read it together.",
        "The nurse takes the write lock and writes systolic 135, but not diastolic yet.",
        "A screen reading without the lock now sees 135/80, a reading that never happened.",
        "A screen using the read lock waits until the nurse's update is complete.",
        "It then shows the whole new reading, 135/90.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
