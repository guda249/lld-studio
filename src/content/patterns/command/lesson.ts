import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-remote.py?raw";
import ex1Scala from "./code/ex1-remote.scala?raw";
import ex2Py from "./code/ex2-jobs.py?raw";
import ex2Scala from "./code/ex2-jobs.scala?raw";
import ex3Py from "./code/ex3-migration.py?raw";
import ex3Scala from "./code/ex3-migration.scala?raw";
import ex4Py from "./code/ex4-moves.py?raw";
import ex4Scala from "./code/ex4-moves.scala?raw";

const lesson: PatternLesson = {
  slug: "command",
  analogy:
    "A restaurant order slip. The waiter writes your order and puts it in the queue; the kitchen cooks it later. The slip can be reordered, cancelled or cooked again, and the waiter never needs to know how to cook.",
  problem: {
    text: "A text editor's toolbar buttons, keyboard shortcuts and menu items all call document methods directly. Nothing records what was done, so you cannot build undo, macros or \"repeat last action\".",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Wrap each action in a command object with execute() and undo(). The command stores its parameters and whatever it needs to reverse itself. An invoker runs commands and keeps a history stack; undo pops the last command and reverses it.",
  participants: [
    { role: "Command", name: "Command", kind: "interface", description: "Declares execute() and undo(). The invoker knows only this." },
    { role: "Concrete command", name: "InsertText, DeleteLastChars", kind: "concrete", description: "Stores the parameters of one action plus what it needs to undo it (DeleteLastChars remembers the deleted text)." },
    { role: "Receiver", name: "Document", kind: "concrete", description: "The object that really changes. Commands call it; it knows nothing about commands." },
    { role: "Invoker", name: "Editor", kind: "concrete", description: "Runs commands and keeps the history stack for undo." },
    { role: "Client", name: "commandDemo", kind: "client", description: "Creates commands with their receiver and hands them to the invoker." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "When you do not need undo, a command is just a function with no arguments: a Callable[[], None] in Python or a () => Unit in Scala can be queued and run later. Switch to command objects once you need undo, serialisation or metadata such as who ran it and when.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Undo and redo in editors and design tools (each edit is a command on a history stack).",
    "Background job queues such as Celery: a task is a stored description of work to run later.",
    "Database migrations with up and down steps (Django, Rails, Flyway).",
    "Redux actions, Java Runnable and Callable, and GUI action objects shared by menus, buttons and shortcuts.",
  ],
  whenToUse: [
    "You need undo/redo, history, macros or an audit log of actions.",
    "Work must be queued, scheduled, retried or sent to another process.",
    "Several UI triggers (button, shortcut, menu) should share the same action.",
  ],
  whenNotToUse: [
    "A simple direct call with no history, queueing or undo. Wrapping it adds classes for nothing.",
    "The action cannot really be reversed (an email already sent) and you were adding Command only for undo.",
  ],
  pros: [
    "Decouples the trigger (invoker) from the work (receiver).",
    "Undo, redo, logging, queueing and retries become easy to add.",
    "New commands do not change the invoker (Open/Closed).",
  ],
  cons: [
    "One class per action, which can mean many small classes.",
    "Undo logic must be designed carefully for each command; a wrong undo corrupts state.",
  ],
  confusedWith: [
    { name: "Strategy", difference: "Strategy is how to do something (interchangeable algorithms). Command is what to do, packed as a request you can store and run later." },
    { name: "Memento", difference: "Memento stores state snapshots for undo; Command stores the operation and reverses it. They are often combined." },
    { name: "Chain of Responsibility", difference: "Chain decides who handles a request. The request travelling along a chain is often a command object." },
  ],
  solid:
    "Single Responsibility (each command is one action), Open/Closed (new commands without editing the editor), Dependency Inversion (the invoker depends only on the Command interface).",
  interviewUses: [
    "Text editor with undo/redo",
    "Smart-home remote with buttons mapped to commands",
    "Job scheduler or task queue",
    "Stock-trading order queue",
    "Restaurant ordering system",
  ],
  examples: [
    {
      id: "remote",
      domain: "Smart home",
      title: "Programmable remote with undo",
      situation:
        "A smart-home remote has numbered buttons that users map to any device action. Hard-wiring button 1 to the light and button 2 to the fan means a new remote class for every room, and there is no undo button.",
      roles: [
        { role: "Command", name: "Command" },
        { role: "Concrete command", name: "LightOn, FanSpeed" },
        { role: "Receiver", name: "Light, Fan" },
        { role: "Invoker", name: "RemoteControl" },
        { role: "Client", name: "remoteDemo" },
      ],
      why: "Each button holds a command object, so the remote does not know what a light or a fan is. Every press is pushed onto a history stack, which makes a single undo button work for all devices.",
      goodToKnow:
        "If the same command object can run twice (the same button pressed twice), it must keep a stack of old values, as FanSpeed does. A single saved value would undo to the wrong speed.",
      walkthrough: [
        "The client assigns LightOn to button 1 and two FanSpeed commands to buttons 2 and 3.",
        "Pressing 1, 2 and 3 turns the light on and sets the fan to 3, then 5.",
        "Each press pushes its command onto the remote's history.",
        "Undo pops FanSpeed(5), which puts the fan back to 3; the next undo puts it back to 0.",
        "The third undo turns the light off, and the fourth finds nothing left to undo.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "jobs",
      domain: "E-commerce backend",
      title: "Background job queue with retries",
      situation:
        "After an order is placed the shop must send an SMS, generate an invoice and sync the payment with the bank. Doing all this inside the web request makes checkout slow, and a bank timeout loses the work.",
      roles: [
        { role: "Command", name: "Job" },
        { role: "Concrete command", name: "SendSms, GenerateInvoice, SyncPayment" },
        { role: "Invoker", name: "JobQueue" },
        { role: "Client", name: "jobsDemo" },
      ],
      why: "Each job is an object holding everything it needs, so it can wait in a queue and run later. Because the job is data, the queue can count attempts and put a failed job back to try again.",
      goodToKnow:
        "Real queues (Celery, Sidekiq) serialise the command to JSON so another machine can run it. Jobs that may run twice should be idempotent: running them again must not charge or message the customer twice.",
      walkthrough: [
        "Four jobs are submitted; nothing runs yet.",
        "work() takes the SMS job first and it succeeds on attempt 1.",
        "SyncPayment TXN42 fails once with a timeout, so it goes to the back of the queue.",
        "The invoice runs and TXN43 fails its first try; then TXN42 succeeds on its second attempt.",
        "TXN43 keeps failing, and after 3 attempts the queue gives up on it.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "migration",
      domain: "Databases",
      title: "Schema migrations with rollback",
      situation:
        "A team changes its database schema every sprint. Running ad-hoc SQL by hand means nobody knows which changes a server already has, and a bad release cannot be reversed safely.",
      roles: [
        { role: "Command", name: "Migration" },
        { role: "Concrete command", name: "CreateUsers, AddPhoneToUsers, CreateOrders" },
        { role: "Receiver", name: "Schema" },
        { role: "Invoker", name: "Migrator" },
        { role: "Client", name: "migrationDemo" },
      ],
      why: "Each migration is a command with up (execute) and down (undo). The migrator records what it applied, so it can skip finished steps and roll back the newest ones in reverse order.",
      goodToKnow:
        "Some changes cannot be undone without losing data (dropping a column throws away its values). Real tools let a migration declare itself irreversible instead of pretending.",
      walkthrough: [
        "migrate() applies all three migrations in order and records each version.",
        "rollback(2) runs down() on CreateOrders and then on AddPhoneToUsers, newest first.",
        "The schema is back to a users table with only id and name.",
        "Calling migrate() again skips 001, which is still applied, and reapplies 002 and 003.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "moves",
      domain: "Games",
      title: "Undo, redo and combo moves",
      situation:
        "A puzzle game needs undo and redo for every move, plus special combo moves made of several steps. Saving the whole board after every move wastes memory and makes combos awkward.",
      roles: [
        { role: "Command", name: "Command" },
        { role: "Concrete command", name: "Move" },
        { role: "Macro command", name: "Combo" },
        { role: "Receiver", name: "Hero" },
        { role: "Invoker", name: "Game" },
        { role: "Client", name: "movesDemo" },
      ],
      why: "A Move knows how to reverse itself, so undo needs no board copies. A Combo is a command made of commands (a macro), so it undoes in one step like any other move.",
      goodToKnow:
        "Clear the redo stack whenever a new move is played. Otherwise redo would replay a future that no longer fits the board.",
      walkthrough: [
        "The hero moves right, then up, then plays a dash combo of three right steps, reaching (4, 1).",
        "Undo reverses the whole dash in one step, back to (1, 1).",
        "A second undo reverses the up move, and redo plays it again.",
        "Playing a new down move clears the redo stack.",
        "So the final redo finds nothing to redo.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
