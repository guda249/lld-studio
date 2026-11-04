import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "thread-pool",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What is the main idea of a thread pool?",
      options: [
        "Create a fixed set of worker threads once and reuse them for many tasks",
        "Start a new thread for each task so that no task ever waits",
        "Give every task its own copy of the data so that no lock is needed",
        "Run every task on the caller's thread, one after another"
      ],
      answer: 0,
      hint: "Think of the courier office: does it hire a new rider for every parcel?",
      explain: "A pool starts its workers once; tasks wait in a queue and free workers take them. A thread per task is the problem the pool fixes, private copies of data are a different technique (confinement), and running everything on the caller's thread gives no concurrency at all."
    },
    {
      type: "bug", tag: "Find the problem",
      prompt: "This program prints its results but never exits. Tap the line that should change (or is missing its partner).",
      code: { lang: "python", text: `pool = ThreadPool(3)
futures = [pool.submit(make_invoice, n) for n in range(1, 11)]
results = [f.result() for f in futures]
print(f"Invoices ready: {len(results)}")
pool = None` },
      answer: 5,
      hint: "The worker threads are still waiting on the queue. Who tells them to stop?",
      explain: "Line 5 only drops the reference; the three workers stay blocked on the queue's get(), so the process cannot end. Call pool.shutdown() (or use a with block with ThreadPoolExecutor), which puts one stop signal per worker and joins them. Submitting, reading results and printing are all fine."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which concurrency pattern does this Scala code use?",
      code: { lang: "scala", text: `import java.util.concurrent.{Callable, Executors}

val workers = Executors.newFixedThreadPool(4)
val pages = (1 to 20).map { n =>
  val job: Callable[String] = () => s"page-$n.html"
  workers.submit(job)
}
println(pages.map(_.get()).size)
workers.shutdown()` },
      options: ["Thread Pool", "Producer–Consumer with poison pills", "Read–Write Lock", "Thread-safe Singleton"],
      answer: 0,
      hint: "Count the threads and the tasks. What does submit() give back?",
      explain: "Four fixed threads run 20 submitted tasks and each submit returns a Future: Thread Pool. A pool has a queue inside (a ready-made Producer–Consumer), but here no consumer class and no poison pills are written by hand. Nothing is guarded by read and write locks, and no single instance is created lazily."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A Python service must download 500 images from a CDN (mostly waiting on the network) and then compute a heavy perceptual hash for each (pure CPU). What is a sensible plan?",
      options: [
        "One ThreadPoolExecutor of 500 threads for both steps",
        "A ThreadPoolExecutor for the downloads and a ProcessPoolExecutor (about one process per core) for the hashing",
        "A ProcessPoolExecutor of 500 processes for both steps",
        "No pool: a for loop is just as fast in Python"
      ],
      answer: 1,
      hint: "Waiting work and computing work need different kinds of pool in Python. Remember the GIL.",
      explain: "Threads suit waiting work because the GIL is released while waiting, so a thread pool speeds up the downloads. Hashing is CPU-bound: threads take turns under the GIL, so processes sized to the cores do it in parallel. 500 threads for hashing adds switching without speed, 500 processes waste memory, and a plain loop waits for each download in turn."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the life of one task in a thread pool in order.",
      steps: [
        "The caller calls submit(task) and gets an empty Future back at once",
        "The task waits in the pool's queue",
        "A free worker takes the task from the queue",
        "The worker runs it and puts the result (or error) into the Future",
        "The caller calls result() / get() and receives the value"
      ],
      shuffled: [2, 4, 0, 3, 1],
      hint: "The Future exists before the work starts, and it is filled before the caller can read it.",
      explain: "submit returns a Future straight away and queues the task; a worker that becomes free takes it, runs it and completes the Future; result() then returns the value (it would wait if the task were not done yet)."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which diagram shows a thread pool?",
      options: [
        {
          label: "Client calls getInstance() on a Registry, which holds its one instance.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 8, y: 70, w: 90 } },
            { id: "r", kind: "singleton", name: "Registry", members: ["- instance", "+ getInstance()"], at: { x: 150, y: 50, w: 170 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "r", type: "dependency" }
          ]
        },
        {
          label: "Client submits tasks to a ThreadPool that owns a task queue and a fixed list of workers, and gets a Future back.",
          width: 330, height: 200,
          nodes: [
            { id: "c", kind: "client", name: "Client", at: { x: 8, y: 20, w: 90 } },
            { id: "p", kind: "concrete", name: "ThreadPool", key: true, members: ["- workers: 3", "- tasks: Queue", "+ submit(t): Future"], at: { x: 150, y: 8, w: 172 } },
            { id: "f", kind: "concrete", name: "Future", members: ["+ result()"], at: { x: 8, y: 126, w: 120 } }
          ],
          edges: [
            { id: "e1", from: "c", to: "p", type: "dependency" },
            { id: "e2", from: "p", to: "f", type: "dependency" }
          ]
        },
        {
          label: "A Publisher holds a list of Listeners and calls each one when an event happens.",
          width: 330, height: 200,
          nodes: [
            { id: "p", kind: "concrete", name: "Publisher", members: ["- listeners: list", "+ publish(e)"], at: { x: 8, y: 50, w: 140 } },
            { id: "l", kind: "interface", name: "Listener", members: ["+ on_event(e)"], at: { x: 190, y: 50, w: 130 } }
          ],
          edges: [
            { id: "e1", from: "p", to: "l", type: "aggregation" }
          ]
        }
      ],
      answer: 1,
      hint: "Look for a fixed set of workers, a queue of tasks and a handle for the result.",
      explain: "B is right: the ThreadPool keeps a fixed set of workers and a task queue, and submit returns a Future. A is a Singleton (one shared instance), and C is Observer (a publisher calls all its listeners)."
    }
  ],
  cards: [
    { id: "tp-intent", front: "Thread Pool: what is its intent, in one line?", back: "Reuse a fixed set of worker threads for many short tasks." },
    { id: "tp-vs-pc", front: "Thread Pool vs Producer–Consumer: what is the difference?", back: "A thread pool is a ready-made Producer–Consumer for general tasks: submit() puts a task in its queue and returns a Future. Build your own Producer–Consumer when consumers do one specific job, or for multi-stage pipelines." },
    { id: "tp-solid", front: "Which SOLID principles does a thread pool support?", back: "Single Responsibility (tasks do the work; the pool decides which thread runs them) and Dependency Inversion (callers depend on submit() and Future, not on Thread, so the pool can change size or kind freely)." },
    { id: "tp-spot", front: "Which pattern is hiding here?", code: { lang: "python", text: "with ThreadPoolExecutor(max_workers=8) as ex:\n    pages = list(ex.map(download, urls))" }, back: "Thread Pool: eight reused threads download every URL, and map returns the pages in the order of the URLs." },
    { id: "tp-uml", front: "UML: how do you draw that submit() returns a Future?", back: "A dashed dependency arrow from ThreadPool to Future (it creates and returns it, then forgets it), and the method line '+ submit(task): Future'. The workers are a composition: the pool creates and owns them." },
    { id: "tp-when-not", front: "When should you NOT use a thread pool?", back: "For a few long-running jobs (give each its own thread), when tasks wait for other tasks in the same pool (starvation), or in Python for CPU-bound work (use a process pool because of the GIL)." }
  ]
};

export default quiz;
