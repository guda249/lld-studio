import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-logs.py?raw";
import ex1Scala from "./code/ex1-logs.scala?raw";
import ex2Py from "./code/ex2-kitchen.py?raw";
import ex2Scala from "./code/ex2-kitchen.scala?raw";
import ex3Py from "./code/ex3-video.py?raw";
import ex3Scala from "./code/ex3-video.scala?raw";
import ex4Py from "./code/ex4-shutdown.py?raw";
import ex4Scala from "./code/ex4-shutdown.scala?raw";

const lesson: PatternLesson = {
  slug: "producer-consumer",
  analogy:
    "The order counter at a busy dosa stall. The cashier (producer) clips each order ticket onto a rail, and the cooks (consumers) take the next ticket when they are free. The rail has room for only so many tickets, so when it is full the cashier stops taking orders for a moment. Nobody shouts orders straight at a cook, and no ticket is cooked twice.",
  problem: {
    text: "A photo upload handler appends jobs to a plain shared list, and thumbnail workers read from it. The list has no limit, so a burst of uploads fills memory. It has no lock, so two workers can both see the same photo first: one photo is processed twice and another is silently lost. Idle workers must keep polling the list to find new work.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Put a bounded, thread-safe queue between the two sides. Producers only call put(): it waits while the queue is full, which slows a fast producer down to the speed the consumers can handle (back-pressure). Consumers only call get() / take(): it waits while the queue is empty, so there is no busy polling, and the queue's own lock hands each item to exactly one consumer. To stop, the producer puts one special 'poison pill' value per consumer after the real work.",
  participants: [
    { role: "Producer", name: "UploadHandler", kind: "concrete", description: "Creates work items (uploaded photos) and puts them into the queue. It does not know which worker will process them, or how many workers exist." },
    { role: "Bounded buffer", name: "Queue (maxsize=3) / ArrayBlockingQueue", kind: "concrete", description: "The thread-safe queue in the middle. put() waits when it is full, get() / take() waits when it is empty, and each item goes to exactly one consumer." },
    { role: "Consumer", name: "ThumbnailWorker", kind: "concrete", description: "A thread that loops: take the next photo, make its thumbnail, repeat, until it takes the STOP pill." },
    { role: "Poison pill", name: "STOP", kind: "enum", description: "A special value placed after the real work. Each consumer that takes it finishes its loop and exits." },
    { role: "Client", name: "Demo code", kind: "client", description: "Creates the queue, starts the workers, produces the photos, sends one pill per worker and waits for them with join()." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "In Python, threads help with I/O-bound work (network, disk) but not with CPU-heavy work: the GIL lets only one thread run Python code at a time, so use processes (multiprocessing.Queue) for heavy number crunching. For I/O work, asyncio.Queue gives the same pattern on one thread, and task_done() + join() replace poison pills. In Scala, consumers can be Futures that each return their own results, and Option marks the end (None is the pill).",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Python's queue.Queue and logging's QueueHandler / QueueListener, which move slow log writing off request threads.",
    "Java's BlockingQueue family (ArrayBlockingQueue, LinkedBlockingQueue), used inside every ThreadPoolExecutor.",
    "Message brokers such as Kafka, RabbitMQ and Amazon SQS: the same pattern between separate services.",
    "Unix pipes: in `cat log | grep ERROR`, cat produces and grep consumes through a bounded kernel buffer.",
  ],
  whenToUse: [
    "Work arrives at a different speed from how fast it can be processed, and you want to smooth out bursts.",
    "Slow work (disk, network, image processing) should not hold up the thread that receives requests.",
    "You want to change the number of workers without touching the code that creates the work.",
    "A job has stages (download, convert, publish) that can run at the same time, each with its own queue.",
  ],
  whenNotToUse: [
    "The caller needs the answer right away: a direct call (or a thread pool future) is simpler.",
    "The work is tiny and quick: the hand-off through a queue costs more than doing it inline.",
    "In Python, the work is CPU-bound: threads will not run it in parallel because of the GIL.",
  ],
  pros: [
    "Producers and consumers are decoupled: neither knows the other, and each side can be scaled on its own.",
    "A bounded queue gives back-pressure, so memory cannot grow without limit during a burst.",
    "The queue's lock does the hard synchronisation; your code has no check-then-act races.",
  ],
  cons: [
    "Shutting down cleanly needs care: one poison pill per consumer, or a stuck thread keeps the process alive.",
    "Errors in a consumer are far from the producer; you need a dead-letter queue or a way to report them.",
    "Order is only guaranteed with one consumer; with many, items finish in any order.",
  ],
  confusedWith: [
    { name: "Observer", difference: "Observer calls every subscriber with each event, right away, on the publisher's thread. Producer–Consumer hands each item to exactly one consumer, later, through a queue, usually on another thread." },
    { name: "Thread Pool", difference: "A thread pool is a ready-made Producer–Consumer: submit() puts a task into the pool's internal queue and its workers take from it. Use the pool when the work items are tasks you want results for; build your own queue when consumers do one specific job or there are several stages." },
  ],
  solid:
    "Single Responsibility (producing, buffering and consuming live in separate classes) and Dependency Inversion (both sides depend on the queue's put / get contract, not on each other). Adding consumers needs no change to the producer (Open/Closed).",
  interviewUses: [
    "Design a logging library that does not slow down request handling.",
    "Design a job or task queue (email sending, video transcoding, report generation).",
    "Implement a bounded blocking queue yourself with a lock and two conditions (not_full, not_empty).",
    "Design a web crawler: fetchers produce URLs, parsers consume pages.",
  ],
  examples: [
    {
      id: "logs",
      domain: "Web backend",
      title: "Batched log writer",
      situation:
        "A web server's request threads write log lines straight to a file. Each write is a slow disk call made while the user waits, and two threads writing at once can mix their lines together.",
      roles: [
        { role: "Producer", name: "request_thread (web-0, web-1, web-2)" },
        { role: "Bounded buffer", name: "lines: Queue" },
        { role: "Consumer", name: "LogWriter" },
        { role: "Poison pill", name: "STOP" },
      ],
      why: "Request threads only drop a line into the queue, which is fast. One writer thread owns the file, so lines never interleave, and it can group lines into batches so the disk is touched far less often.",
      goodToKnow:
        "Send the STOP pill only after every producer has finished (join them first). A pill that arrives too early makes the writer stop while lines are still coming, and those lines are lost.",
      walkthrough: [
        "Three request threads each put 4 log lines into one shared queue.",
        "Only the LogWriter thread takes lines off the queue, so the file is never written by two threads at once.",
        "It collects lines into a batch of 5 and writes each full batch to disk in one go.",
        "After all producers finish, a STOP pill makes the writer flush the last 2 lines and exit.",
        "12 lines reach the file in 3 disk writes instead of 12.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "kitchen",
      domain: "Cloud kitchen",
      title: "Ticket rail in a rush",
      situation:
        "During the Friday rush, orders arrive faster than two chefs can cook. Letting tickets pile up without limit means customers wait an hour for food that should have been refused or cancelled.",
      roles: [
        { role: "Producer", name: "Waiter (the order loop)" },
        { role: "Bounded buffer", name: "TicketRail" },
        { role: "Consumer", name: "Chef threads" },
      ],
      why: "A bounded rail makes the overload visible. When it is full, the producer must choose a policy: wait (put blocks), reject the newest order, or drop the oldest one. Each choice is one line in the producer side of the buffer.",
      goodToKnow:
        "Waiting is the safe default for internal work; rejecting is better for user requests, so they get a fast 'try later'. Dropping the oldest suits data where only fresh values matter, such as live sensor readings.",
      walkthrough: [
        "Five orders, #101 to #105, arrive while both chefs are still busy.",
        "The rail holds 3 tickets, so #101, #102 and #103 go up.",
        "With the reject policy, #104 and #105 are turned away at once instead of piling up.",
        "When the chefs are free they take tickets from the rail and cook #101, #102 and #103.",
        "With drop oldest instead, the rail keeps the newest three, #103 to #105.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "video",
      domain: "Ed-tech",
      title: "Lecture video pipeline",
      situation:
        "A course platform must convert uploaded lecture videos and then publish them. Doing both steps in one loop means a slow conversion holds up publishing, and one corrupt file crashes the whole batch.",
      roles: [
        { role: "Producer", name: "Uploader (demo loop)" },
        { role: "Bounded buffer", name: "raw, encoded: Queue" },
        { role: "Consumer", name: "Transcoder (also a producer), Publisher" },
        { role: "Poison pill", name: "STOP (passed down the line)" },
      ],
      why: "Chaining queues turns the job into a pipeline: each stage is a consumer of the queue before it and a producer for the queue after it. Stages run at the same time, and a bad item goes to a dead-letter queue instead of stopping everything.",
      goodToKnow:
        "With one thread per stage, the pill can simply be passed on. With several threads in a stage, the next stage must wait for one pill from each of them before it stops.",
      walkthrough: [
        "The uploader puts three lecture videos and a STOP pill into the raw queue.",
        "The transcoder takes from raw and puts each converted .mp4 into the encoded queue.",
        "arrays.corrupt cannot be converted, so it goes to the dead-letter queue and the line keeps moving.",
        "The publisher takes from encoded and publishes intro.mp4 and graphs.mp4.",
        "The STOP pill travels down the line, so each stage stops only after the work ahead of it.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "shutdown",
      domain: "Fintech",
      title: "Stopping OTP senders on deploy",
      situation:
        "A payments app sends OTP messages through three sender threads. During a deploy the old process must finish sending and exit, but it kept hanging and had to be killed, sometimes losing messages.",
      roles: [
        { role: "Producer", name: "deploy_shutdown (the app)" },
        { role: "Bounded buffer", name: "outbox: Queue" },
        { role: "Consumer", name: "SmsSender" },
        { role: "Poison pill", name: "STOP" },
      ],
      why: "A consumer blocked on get() only wakes up when something arrives. A poison pill is that something: real work first, then one pill for each consumer, so every thread finishes the queue and exits by itself.",
      goodToKnow:
        "The bug is sending one pill for many consumers. The demo marks the senders as daemon threads only so it can finish; in a real service a stuck non-daemon thread keeps the process alive.",
      walkthrough: [
        "Three SMS sender threads wait on the outbox queue.",
        "Six OTP messages are queued, and the senders share them out.",
        "At deploy time the app puts only one STOP pill into the queue.",
        "One sender takes the pill and exits; the other two wait on get() forever.",
        "With one pill per sender, all three stop and the deploy finishes cleanly.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
