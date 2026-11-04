import type { CaseStudy } from "../../extras/types";
import python from "./code/main.py?raw";
import scala from "./code/Main.scala?raw";

const logger: CaseStudy = {
  slug: "logger",
  title: "Logging framework",
  difficulty: 2,
  tagline: "Named loggers, levels, pluggable formats and destinations, and a buffer for slow writes.",
  prompt:
    "Design a small logging library like the one in your language's standard library. Code asks for a named logger, logs messages at a level, and the messages end up in one or more places (console, file) in a chosen format.",
  clarify: [
    { q: "Which levels do we need?", a: "DEBUG, INFO, WARN and ERROR, in that order. A logger drops anything below its level." },
    { q: "Do loggers form a hierarchy, like app.db under app?", a: "Yes. A logger without its own level uses its parent's, and records also go to the parent's destinations (propagation), up to root." },
    { q: "Where can logs go, and in what format?", a: "Console and an in-memory list (our stand-in for a file). Plain text or JSON. Both lists will grow, so they must be pluggable." },
    { q: "Must writes be fast, even to a slow destination?", a: "A slow destination can be wrapped in a buffer that writes in batches. Errors are written at once so they are never lost in a buffer." },
    { q: "Thread safety and timestamps?", a: "Single thread for this design. Records carry a tick counter instead of a wall-clock time so the demo is repeatable; a real clock would be injected the same way." }
  ],
  requirements: {
    functional: [
      "get_logger(name) always returns the same Logger for the same name",
      "Each logger has an optional level; without one it uses its parent's (root defaults to INFO)",
      "A record below the effective level is dropped before it is built",
      "A logger sends each record to its own appenders, then to its parent's, unless propagation is off",
      "Formats (plain, JSON) and destinations (console, memory) can be combined freely",
      "A buffered destination writes in batches but flushes at once on ERROR"
    ],
    nonFunctional: [
      "Logging a message below the level costs almost nothing (one comparison)",
      "Adding a new format or destination needs no change in Logger",
      "Deterministic output for tests (no hidden clock)"
    ],
    outOfScope: ["Log rotation and real files", "Thread safety and async writing", "Configuration from a file", "Structured context (MDC) fields"]
  },
  entities: [
    { name: "Logger", responsibility: "Named entry point: checks the level, builds the LogRecord and publishes it to its appenders and up to its parent." },
    { name: "LogManager", responsibility: "The one registry of loggers; creates missing parents so the dotted names form a tree." },
    { name: "LogRecord", responsibility: "One event: tick, level, logger name and message. Immutable." },
    { name: "Appender", responsibility: "A destination that receives records (console, memory, file…)." },
    { name: "Formatter", responsibility: "Turns a record into a line of text: plain or JSON." },
    { name: "BufferedAppender", responsibility: "Wraps another Appender and passes records on in batches." },
    { name: "Level", responsibility: "The ordered severities DEBUG < INFO < WARN < ERROR." }
  ],
  uml: {
    classes: [
      { name: "LogManager", kind: "concrete", members: ["- loggers: map of Logger", "+ get_logger(name): Logger", "+ root(): Logger"] },
      { name: "Logger", kind: "concrete", members: ["+ level: Level?", "- parent: Logger?", "- appenders: list", "+ log(level, message)", "+ add_appender(a)"] },
      { name: "LogRecord", kind: "concrete", members: ["+ tick", "+ level", "+ logger", "+ message"] },
      { name: "Level", kind: "enum", members: ["DEBUG", "INFO", "WARN", "ERROR"] },
      { name: "Appender", kind: "interface", members: ["+ append(record)"] },
      { name: "ConsoleAppender", kind: "concrete", members: ["- formatter", "- min_level", "+ append(record)"] },
      { name: "MemoryAppender", kind: "concrete", members: ["- formatter", "+ lines", "+ append(record)"] },
      { name: "BufferedAppender", kind: "concrete", members: ["- inner: Appender", "- pending", "+ append(record)", "+ flush()"] },
      { name: "Formatter", kind: "interface", members: ["+ format(record): str"] },
      { name: "PlainFormatter", kind: "concrete", members: ["+ format(record)"] },
      { name: "JsonFormatter", kind: "concrete", members: ["+ format(record)"] }
    ],
    relations: [
      { from: "LogManager", to: "Logger", type: "aggregation" },
      { from: "Logger", to: "Appender", type: "aggregation" },
      { from: "ConsoleAppender", to: "Appender", type: "realization" },
      { from: "MemoryAppender", to: "Appender", type: "realization" },
      { from: "BufferedAppender", to: "Appender", type: "realization" },
      { from: "ConsoleAppender", to: "Formatter", type: "association" },
      { from: "MemoryAppender", to: "Formatter", type: "association" },
      { from: "PlainFormatter", to: "Formatter", type: "realization" },
      { from: "JsonFormatter", to: "Formatter", type: "realization" },
      { from: "LogRecord", to: "Level", type: "association" },
      { from: "Appender", to: "LogRecord", type: "dependency" }
    ]
  },
  flow: {
    title: "payments.error(…) reaches the buffer and the console",
    sequence: {
      label: "App calls error on the app.payments Logger; it builds a LogRecord, gives it to its BufferedAppender, which flushes to the MemoryAppender, then publishes to the root Logger, whose ConsoleAppender prints it.",
      participants: [
        { id: "app", name: "App", kind: "client" },
        { id: "pay", name: "app.payments : Logger", kind: "concrete" },
        { id: "buf", name: "BufferedAppender", kind: "concrete" },
        { id: "mem", name: "MemoryAppender", kind: "concrete" },
        { id: "root", name: "root : Logger", kind: "concrete" },
        { id: "con", name: "ConsoleAppender", kind: "concrete" }
      ],
      messages: [
        { from: "app", to: "pay", label: "error(\"card declined…\")" },
        { from: "pay", to: "pay", label: "level check, build LogRecord", kind: "self" },
        { from: "pay", to: "buf", label: "append(record)" },
        { from: "buf", to: "mem", label: "flush(): append × 3" },
        { from: "pay", to: "root", label: "publish(record)" },
        { from: "root", to: "con", label: "append(record)" },
        { from: "con", to: "con", label: "format and print", kind: "self" }
      ]
    }
  },
  patterns: [
    {
      slug: "singleton",
      where: "LogManager (a Scala object; a class with instance() in Python)",
      why: "Every module must get the same Logger for \"app.db\", or levels and appenders set in one place would be missing in another. One registry guarantees that."
    },
    {
      slug: "observer",
      where: "Logger publishes each LogRecord to its list of Appender subscribers",
      why: "The logger should not know where logs go. Adding a destination is add_appender, with no change to Logger."
    },
    {
      slug: "strategy",
      where: "Formatter with PlainFormatter and JsonFormatter, held by each appender",
      why: "Format and destination change independently: JSON to memory, plain to console. Without it you'd need a class per pair."
    },
    {
      slug: "chain-of-responsibility",
      where: "Logger._publish passes the record up to its parent Logger until root (or propagate is off)",
      why: "Attach the console once at root and every logger in the tree uses it; a subtree can stop the chain by turning propagation off."
    },
    {
      slug: "decorator",
      where: "BufferedAppender wraps any Appender and is itself an Appender",
      why: "Batching is an extra behaviour you add to a slow destination without changing it or the Logger."
    }
  ],
  code: { python, scala },
  tradeoffs: [
    "We chose to check the level before building the LogRecord over filtering inside the appenders because most debug calls in production are below the level, and they should cost one comparison.",
    "We chose separate Formatter and Appender types over classes like JsonFileAppender because formats and destinations then combine freely (2 + 2 classes instead of 2 × 2).",
    "We chose propagation to the parent over copying appenders to every logger because one change at root (say, switching the console to JSON) then reaches every logger.",
    "We chose to flush the buffer at once on ERROR over a pure size-based batch because the last lines before a crash are the ones you need most.",
    "We chose a tick counter injected by LogManager over reading the clock in Logger, so tests and the demo produce the same output every time."
  ],
  followUps: [
    { q: "How do you make it safe for many threads?", a: "Guard each appender's write with a lock (or give it a queue). Better: an AsyncAppender decorator puts records on a queue and one background thread writes them, so callers never wait for I/O." },
    { q: "Logging slows the hot path. What can you do?", a: "Check the level first (we do), avoid building the message string when the level is off (pass a lambda or format args), and use the async appender so the write happens elsewhere." },
    { q: "What happens to buffered lines if the app crashes?", a: "They are lost. Flush on ERROR (we do), flush on a timer, and flush in a shutdown hook. For critical audit logs, skip the buffer." },
    { q: "How would you add request ids to every line?", a: "Add a context map to LogRecord, filled from a per-request (thread-local or context-variable) store when the record is built. Formatters then print it. This is often called MDC." },
    { q: "How would you configure it from a file?", a: "Parse the file into rules (logger name → level and appender names), then call get_logger, set level and add_appender. The core classes don't change; a Builder can make the setup code readable." }
  ],
  extend: [
    "Add a FileAppender that writes to a file and rotates to app.1.log when it passes N lines.",
    "Add a LevelFilterAppender decorator that only passes records at or above a level, and use it to send only ERROR to a second MemoryAppender.",
    "Let Logger.log take a function that builds the message, and call it only if the level passes. Count how often it is called in the demo.",
    "Add a context dict to LogRecord (request id, user id) and print it in JsonFormatter."
  ],
  quiz: [
    {
      type: "mcq", tag: "Concept",
      prompt: "app.db has no level of its own. app is set to DEBUG and root to INFO. What is app.db's effective level?",
      options: ["DEBUG", "INFO", "No level: everything is logged", "ERROR"],
      answer: 0,
      hint: "Walk up the dotted name until you find a logger that has its own level.",
      explain: "effective_level walks up: app.db has none, so it asks app, which has DEBUG. Root's INFO is only used when nothing closer has a level. A logger always ends up with some level, so 'no level' is wrong."
    },
    {
      type: "bug", tag: "Find the problem",
      prompt: "Tap the line that makes debug logging expensive even when the level is INFO.",
      code: { lang: "python", text: `class Logger:
    def log(self, level: Level, message: str) -> None:
        record = LogRecord(self._clock(), level, self.name, message)
        if level.value < self.effective_level().value:
            return
        self._publish(record)` },
      answer: 3,
      hint: "What work happens before we know the message will be dropped?",
      explain: "Line 3 builds the record (and ticks the clock) before the level check, so every dropped debug call still pays for it, and the tick numbers get gaps. Check the level first, then build the record."
    },
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "BufferedAppender implements Appender, holds another Appender and adds batching before passing records on. Which pattern is that?",
      options: ["Decorator", "Observer", "Strategy", "Singleton"],
      answer: 0,
      hint: "It has the same interface as the thing it holds, and it adds behaviour.",
      explain: "Same interface, wraps another instance, adds behaviour: Decorator. Observer is the Logger-to-appenders link, Strategy is the Formatter choice, and Singleton is LogManager."
    },
    {
      type: "order", tag: "Put in order",
      prompt: "Put the steps of payments.error(\"card declined\") in order.",
      steps: [
        "Check ERROR against the logger's effective level",
        "Build a LogRecord with the next tick",
        "Give the record to app.payments' own appenders",
        "Pass the record up to the parent logger (app, then root)",
        "Root's ConsoleAppender formats and prints it"
      ],
      shuffled: [3, 1, 4, 0, 2],
      hint: "Nothing is built until the level check passes; own appenders come before the parent's.",
      explain: "The level check comes first so dropped messages are cheap, then the record is built, then the logger's own appenders run, then propagation sends it up the chain, where root's console prints it."
    }
  ]
};

export default logger;
