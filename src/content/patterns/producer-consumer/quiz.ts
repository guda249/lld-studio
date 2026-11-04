import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "producer-consumer",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "Why should the queue between producers and consumers be bounded (have a maximum size)?",
      options: [
        "So that a fast producer is made to wait, and memory cannot grow without limit during a burst",
        "So that each item is handed to every consumer, not just one",
        "So that consumers can skip locking when they read the queue",
        "So that items always finish in the order they were produced, even with many consumers"
      ],
      answer: 0,
      hint: "What happens to an unbounded list when uploads arrive faster than workers can process them?",
      explain: "A bounded queue makes put() wait when it is full. That is back-pressure: the producer slows to the consumers' speed and memory stays capped. Each item still goes to exactly one consumer, the queue's own lock is what keeps it safe (bounded or not), and with many consumers items can finish in any order."
    },
    {
      type: "bug", tag: "Find the problem",
      prompt: "This program starts three workers but never exits: two threads wait forever. Tap the line that causes it.",
      code: { lang: "python", text: `jobs: Queue[str | None] = Queue(maxsize=5)
workers = [Sender(jobs) for _ in range(3)]
for w in workers:
    w.start()
for msg in ["otp:1", "otp:2", "otp:3"]:
    jobs.put(msg)
jobs.put(STOP)
for w in workers:
    w.join()
print("all senders stopped")` },
      answer: 7,
      hint: "How many consumers are there, and how many poison pills are put into the queue?",
      explain: "Line 7 puts a single STOP pill. One sender takes it and exits; the other two block on get() forever, so join() never returns. Put one pill per worker (for _ in workers: jobs.put(STOP)). The bounded size, the start loop and the join loop are all fine."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which concurrency pattern does this Scala code use?",
      code: { lang: "scala", text: `import java.util.concurrent.ArrayBlockingQueue

val orders = ArrayBlockingQueue[String](10)

class Cashier extends Thread:
  override def run(): Unit =
    for n <- 1 to 5 do orders.put(s"order-$n")

class Cook extends Thread:
  override def run(): Unit =
    for _ <- 1 to 5 do println(s"cooked \${orders.take()}")` },
      options: ["Observer", "Producer–Consumer", "Read–Write Lock", "Command"],
      answer: 1,
      hint: "One thread calls put(), another calls take() on the same bounded queue.",
      explain: "The Cashier produces orders into a bounded ArrayBlockingQueue and the Cook takes them out on its own thread: Producer–Consumer. Observer would call every listener at once on the publisher's thread, a Read–Write Lock guards shared data with two lock modes, and Command wraps a request as an object (the strings here are just data)."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A Python service must resize 10,000 large images, which is pure CPU work. A teammate builds a queue.Queue with 8 consumer threads but it is no faster than one thread. Why, and what helps?",
      options: [
        "The queue is too small; make it unbounded",
        "The GIL lets only one thread run Python code at a time; use processes (multiprocessing) as consumers",
        "Eight is too few; start one thread per image",
        "The poison pill slows the consumers; remove it"
      ],
      answer: 1,
      hint: "Threads in CPython help with waiting on disk or network. What about number crunching?",
      explain: "CPU-bound Python threads take turns under the GIL, so more threads add no speed. Keep the Producer–Consumer shape but use processes (multiprocessing.Queue or a ProcessPoolExecutor). An unbounded queue only removes back-pressure, more threads add more switching, and the pill is sent once at the end, so it costs nothing."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of a clean producer–consumer run in order.",
      steps: [
        "Create a bounded queue",
        "Start the consumer threads; they wait on get()",
        "The producer puts the real work items",
        "Put one STOP pill per consumer",
        "join() each consumer and read the results"
      ],
      shuffled: [3, 0, 4, 2, 1],
      hint: "Consumers must be running before the queue fills up, and the pills go after the real work.",
      explain: "The queue exists first, the consumers start and wait, then the producer puts work (if consumers were not running, a bounded put() would wait forever). Pills go after the real work so no item is left behind, and join() waits for every consumer to finish."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which diagram shows Producer–Consumer?",
      options: [
        {
          label: "Publisher holds a list of Subscribers and calls notify() on each.",
          width: 330, height: 200,
          nodes: [
            { id: "p", kind: "concrete", name: "Publisher", members: ["- subs: list", "+ publish(e)"], at: { x: 8, y: 50, w: 130 } },
            { id: "s", kind: "interface", name: "Subscriber", members: ["+ notify(e)"], at: { x: 190, y: 50, w: 130 } }
          ],
          edges: [
            { id: "e1", from: "p", to: "s", type: "aggregation" }
          ]
        },
        {
          label: "Cache owns a ReadWriteLock; Readers and a Writer use Cache.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "concrete", name: "Cache", members: ["+ get(k)"], at: { x: 8, y: 20, w: 120 } },
            { id: "l", kind: "concrete", name: "ReadWriteLock", members: ["+ read()", "+ write()"], at: { x: 170, y: 20, w: 152 } },
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
            { id: "q", kind: "concrete", name: "BlockingQueue", key: true, members: ["+ put(x)", "+ take()"], at: { x: 116, y: 50, w: 120 } },
            { id: "k", kind: "client", name: "Consumer", at: { x: 246, y: 60, w: 78 } }
          ],
          edges: [
            { id: "e1", from: "p", to: "q", type: "dependency" },
            { id: "e2", from: "k", to: "q", type: "dependency" }
          ]
        }
      ],
      answer: 2,
      hint: "Look for a queue in the middle that both sides use, and that neither side knows about the other.",
      explain: "C is right: Producer and Consumer only know the BlockingQueue, which holds the work between them. A is Observer: the publisher calls every subscriber directly. B is a Read–Write Lock guarding shared data, with no hand-off of work."
    }
  ],
  cards: [
    { id: "pc-intent", front: "Producer–Consumer: what is its intent, in one line?", back: "Hand work from producers to consumers through a bounded, thread-safe queue." },
    { id: "pc-vs-observer", front: "Producer–Consumer vs Observer: what is the difference?", back: "Observer calls every subscriber with each event, right away, on the publisher's thread. Producer–Consumer gives each item to exactly one consumer, later, through a queue, usually on another thread." },
    { id: "pc-solid", front: "Which SOLID principles does Producer–Consumer support?", back: "Single Responsibility (producing, buffering and consuming are separate) and Dependency Inversion (both sides depend on the queue's put / get contract, not on each other). Adding consumers needs no producer change (Open/Closed)." },
    { id: "pc-spot", front: "Which pattern is hiding here?", code: { lang: "python", text: "lines: Queue[str | None] = Queue(maxsize=100)\n# request threads\nlines.put(\"GET /home 200\")\n# writer thread\nwhile (line := lines.get()) is not None:\n    file.write(line)" }, back: "Producer–Consumer: request threads produce log lines into a bounded queue, one writer thread consumes them, and None is the poison pill." },
    { id: "pc-uml", front: "UML: how do you draw a producer that only uses the queue it was given?", back: "A dashed dependency arrow from Producer to the BlockingQueue (or a solid association line if it keeps the queue in a field). Both Producer and Consumer point at the queue, never at each other." },
    { id: "pc-when-not", front: "When should you NOT use Producer–Consumer?", back: "When the caller needs the answer right away, when the work is tiny (the hand-off costs more), or in Python when the work is CPU-bound and threads cannot run in parallel because of the GIL." }
  ]
};

export default quiz;
