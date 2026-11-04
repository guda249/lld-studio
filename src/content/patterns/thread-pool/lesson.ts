import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-fares.py?raw";
import ex1Scala from "./code/ex1-fares.scala?raw";
import ex2Py from "./code/ex2-sizing.py?raw";
import ex2Scala from "./code/ex2-sizing.scala?raw";
import ex3Py from "./code/ex3-saturation.py?raw";
import ex3Scala from "./code/ex3-saturation.scala?raw";
import ex4Py from "./code/ex4-starvation.py?raw";
import ex4Scala from "./code/ex4-starvation.scala?raw";

const lesson: PatternLesson = {
  slug: "thread-pool",
  analogy:
    "A courier office with three delivery riders. The office does not hire a new rider for every parcel and fire them after one drop. Parcels wait on a shelf, and whichever rider is back first takes the next one. Each customer gets a tracking slip at once, so they can check later whether their parcel arrived or came back.",
  problem: {
    text: "An order service starts a brand-new thread for every invoice it makes. Starting a thread costs time and memory, and each thread dies after one job. Nothing limits how many run at once, so a burst of 1,000 orders starts 1,000 threads. And a plain thread throws away its return value: the caller never gets the invoice back, or hears about an error.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Create a small, fixed set of worker threads once, and keep them. Callers submit tasks; each task waits in the pool's internal queue until a worker is free. Workers loop: take the next task, run it, take the next. submit() returns a Future at once, a handle that later holds the task's result or its error. When the work is done, shut the pool down so the workers stop.",
  participants: [
    { role: "Thread pool", name: "ThreadPool", kind: "concrete", description: "Owns the task queue and a fixed number of worker threads. It offers submit() and shutdown(); callers never touch the threads." },
    { role: "Task queue", name: "tasks: Queue / LinkedBlockingQueue", kind: "concrete", description: "The pool's internal waiting room. submit() puts a task in; free workers take the next one out." },
    { role: "Worker", name: "worker threads (created once)", kind: "concrete", description: "Each loops: take a task, run it, put the result into its Future, repeat, until it takes the stop signal." },
    { role: "Future", name: "Future / CompletableFuture", kind: "concrete", description: "A handle returned by submit(). It is empty at first; later it holds the result or the exception the task raised." },
    { role: "Task", name: "make_invoice / makeInvoice", kind: "concrete", description: "A plain function with its arguments. It knows nothing about threads." },
    { role: "Client", name: "Demo code", kind: "client", description: "Creates the pool, submits ten orders, shuts the pool down and reads every Future." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "You rarely write a pool yourself. Python has concurrent.futures.ThreadPoolExecutor: use it in a with block, and submit() + as_completed() or map() (which keeps input order). Threads help I/O-bound work; for CPU-bound work the GIL lets only one thread run Python code at a time, so use ProcessPoolExecutor. Scala uses the JDK's Executors.newFixedThreadPool wrapped in an ExecutionContext, so ordinary Futures run on it; Future.traverse submits a whole list and collects the results in order.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Python's concurrent.futures.ThreadPoolExecutor and ProcessPoolExecutor.",
    "Java's ExecutorService (Executors.newFixedThreadPool, ThreadPoolExecutor), and Scala's global ExecutionContext.",
    "Web servers such as Tomcat and Gunicorn's threaded workers: a fixed pool of threads serves all requests.",
    "Database connection pools (HikariCP, SQLAlchemy's pool) use the same idea for connections instead of threads.",
  ],
  whenToUse: [
    "You have many short, independent tasks, such as API calls, file downloads or report pages.",
    "Creating a thread per task would be wasteful, or a burst could start far too many threads.",
    "You need each task's result or error back, so a Future per task fits well.",
    "You want one place to cap how much runs at the same time (pool size and queue size).",
  ],
  whenNotToUse: [
    "There are only a few long-running jobs: a dedicated thread each is clearer.",
    "Tasks wait for other tasks submitted to the same pool: the pool can starve and hang.",
    "In Python, the work is CPU-bound: threads will not run it in parallel because of the GIL; use processes.",
  ],
  pros: [
    "Threads are created once and reused, so each task skips the start-up cost.",
    "The pool size caps how many tasks run at once, which protects memory, CPU and the services you call.",
    "Futures bring results and errors back to the caller in one tidy handle.",
  ],
  cons: [
    "Choosing the size takes thought: too small wastes cores, too large wastes memory and switching time.",
    "The default queue is unbounded, so a burst can still pile up tasks; bound it and decide what to reject.",
    "A task that blocks on another task in the same pool can deadlock it (pool starvation).",
  ],
  confusedWith: [
    { name: "Producer–Consumer", difference: "A thread pool is a ready-made Producer–Consumer: submit() produces tasks into its internal queue and the workers consume them. Use the pool for general tasks with results; build your own queue when consumers do one specific job or you have pipeline stages." },
    { name: "Command", difference: "A submitted task is like a Command object (a request wrapped up to run later), and the pool is what runs it. Command is about wrapping the request (undo, logging, queuing); Thread Pool is about which threads run work and how many at once." },
  ],
  solid:
    "Single Responsibility: tasks only do their job, and the pool alone decides which thread runs them and when. Dependency Inversion: callers depend on submit() and Future, not on Thread, so you can swap a pool of 3 for 30, or for processes, without touching the tasks.",
  interviewUses: [
    "Implement a simple thread pool with a blocking queue and worker threads.",
    "How would you size a thread pool for CPU-bound versus I/O-bound work?",
    "Design a web crawler or image downloader that fetches many URLs at once without opening thousands of threads.",
    "What happens when the pool's queue is full? Compare reject, caller-runs and wait.",
  ],
  examples: [
    {
      id: "fares",
      domain: "Travel",
      title: "Fare search across six airlines",
      situation:
        "A flight search page asks six airline APIs for a fare, one after another. Each call spends about 20 ms waiting on the network, so the user waits 120 ms for answers that could come back together.",
      roles: [
        { role: "Thread pool", name: "ThreadPoolExecutor / newFixedThreadPool" },
        { role: "Task", name: "fetch_fare / fetchFare" },
        { role: "Client", name: "FareSearch" },
      ],
      why: "The calls are independent and mostly waiting, so several can wait at the same time. A pool caps how many calls hit the airlines at once, and map / invokeAll returns the fares in the order they were asked for.",
      goodToKnow:
        "More workers stop helping once every call has its own thread: 6 workers for 6 airlines is the most that helps. In Python this works because waiting on the network releases the GIL.",
      walkthrough: [
        "FareSearch creates a pool of 3 workers and submits one fetch task per airline: 6 tasks.",
        "Workers 1 to 3 each take a call, and the other three tasks wait in the pool's queue.",
        "As each worker finishes, the same thread takes the next waiting call: no new threads are made.",
        "After two rounds of about 20 ms, all six fares are back, in the order they were asked for.",
        "The cheapest is Kite Air at ₹4,180, found in about 40 ms instead of 120 ms.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "sizing",
      domain: "Ed-tech",
      title: "Sizing pools for a code-grading service",
      situation:
        "An online judge grades student code. Some tasks run test suites (pure computing), others download submissions from storage (mostly waiting). The team used one pool of 50 threads for everything, and test runs fought for the CPU.",
      roles: [
        { role: "Thread pool", name: "one pool per kind of work" },
        { role: "Task", name: "run tests, lint + fetch, fetch files" },
        { role: "Client", name: "PoolSizer" },
      ],
      why: "The right size depends on how much of each task is waiting. A rule of thumb is threads = cores × (1 + wait time ÷ compute time): CPU work needs about one thread per core, while waiting work can share a core among many threads.",
      goodToKnow:
        "In Python, CPU-bound tests should run in a ProcessPoolExecutor with one process per core, because the GIL stops threads computing in parallel. On the JVM, a fixed thread pool sized to the cores is fine.",
      walkthrough: [
        "PoolSizer knows how long each kind of task waits and computes, in milliseconds.",
        "Running tests computes for 100 ms and never waits, so 4 cores need just 4 threads.",
        "Lint + fetch waits as long as it computes, so the formula doubles it: 8 threads.",
        "Fetching files waits 180 ms for every 20 ms of work, so 4 cores can keep 40 threads busy.",
        "The demo makes a pool of 40 and fetches five submissions with it.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "saturation",
      domain: "Food delivery",
      title: "Push notifications at the dinner peak",
      situation:
        "At 8 pm, a food app sends 'your order is on its way' pushes through a slow push service. The executor's queue has no limit, so during the peak thousands of pushes pile up in memory and arrive long after the food.",
      roles: [
        { role: "Thread pool", name: "BoundedPool" },
        { role: "Task queue", name: "bounded: Semaphore / ArrayBlockingQueue" },
        { role: "Task", name: "push" },
        { role: "Client", name: "dinner_peak / dinnerPeak" },
      ],
      why: "A bounded pool accepts at most workers + queue size tasks. The rest are rejected at once, so the caller can retry later or send an SMS instead, and memory stays flat.",
      goodToKnow:
        "Java's ThreadPoolExecutor has this built in: give it an ArrayBlockingQueue and a rejection policy. AbortPolicy throws; CallerRunsPolicy makes the caller run the task itself, which slows the producer down.",
      walkthrough: [
        "Ten pushes arrive at once, and the push service is slow to answer.",
        "The pool has 2 workers, and both start a push straight away.",
        "Its queue holds 2 more pushes, which wait for a free worker.",
        "Pushes 5 to 10 find no room and are rejected at once.",
        "When the service answers, the 4 accepted pushes are sent and 6 were turned away early.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "starvation",
      domain: "E-commerce",
      title: "Order check that waits on its own pool",
      situation:
        "An order service confirms orders on a pool of 2 workers. Each confirmation submits a stock check to the same pool and waits for it. During a sale the service froze, with both threads waiting and nothing running.",
      roles: [
        { role: "Thread pool", name: "orders (and stock)" },
        { role: "Task", name: "confirm, check_stock / checkStock" },
        { role: "Client", name: "OrderService" },
      ],
      why: "A worker that waits for another task in its own pool holds a thread while doing nothing. If every worker does this, the inner tasks sit in the queue forever. This is pool starvation, a kind of deadlock.",
      goodToKnow:
        "Fixes: give inner tasks their own pool, never block inside a pool task (chain futures instead), or at least use a timeout so the service fails instead of hanging.",
      walkthrough: [
        "Two orders, a kurta and a saree, arrive, and both workers start confirming one.",
        "Each confirmation submits a stock check to the same pool and waits for its answer.",
        "Both stock checks sit in the queue: every worker is busy waiting, so none can run them.",
        "After 50 ms both waits time out: 0 confirmed, 2 timed out.",
        "With a separate pool for stock checks, both checks run at once and both orders are confirmed.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
