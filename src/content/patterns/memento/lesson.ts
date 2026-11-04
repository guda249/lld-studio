import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-canvas.py?raw";
import ex1Scala from "./code/ex1-canvas.scala?raw";
import ex2Py from "./code/ex2-cart.py?raw";
import ex2Scala from "./code/ex2-cart.scala?raw";
import ex3Py from "./code/ex3-config.py?raw";
import ex3Scala from "./code/ex3-config.scala?raw";
import ex4Py from "./code/ex4-game.py?raw";
import ex4Scala from "./code/ex4-game.scala?raw";

const lesson: PatternLesson = {
  slug: "memento",
  analogy:
    "Save points in a video game. The game writes everything about your progress into a save slot. You cannot open the slot and edit what is inside; you can only load it to go back to that moment.",
  problem: {
    text: "To support undo, a History class reads and writes the editor's private text and cursor fields directly. That breaks encapsulation: in Scala the fields even have to be made public, and when the editor gains a new field such as a selection, History silently forgets to save it.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "The object that owns the state (the originator) makes an immutable snapshot of itself, called a memento, and knows how to restore itself from one. A separate caretaker keeps the mementos, for example on an undo stack, but never looks inside them. Only the originator reads a memento, so its internals stay private.",
  participants: [
    { role: "Originator", name: "Editor", kind: "concrete", description: "Owns the real state. save() creates a snapshot of itself and restore() puts a snapshot back." },
    { role: "Memento", name: "EditorSnapshot", kind: "concrete", description: "An immutable copy of the editor's state (text and cursor). A frozen dataclass in Python, a case class in Scala." },
    { role: "Caretaker", name: "History", kind: "concrete", description: "Stores snapshots on a stack and hands them back for undo. It never reads or changes what is inside them." },
    { role: "Client", name: "Demo code", kind: "client", description: "Asks the editor for a snapshot before each risky change and asks History for one when the user presses undo." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "With immutable data the object is its own memento: every edit returns a new EditorState, so a plain list of past states is the whole undo history. Python frozen dataclasses with replace() and Scala case classes with copy() make this natural. To guard the memento more strictly, Scala can make its constructor package-private; Python relies on the underscore convention.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Undo history in text editors, design tools such as Figma, and spreadsheets.",
    "Database transactions and savepoints: ROLLBACK TO SAVEPOINT returns to a known state.",
    "Game save slots, auto-saved form drafts and \"restore previous version\" features.",
    "Checkpointing in long-running data jobs, for example Spark and Flink checkpoints.",
  ],
  whenToUse: [
    "You need undo, rollback or \"restore to a previous version\".",
    "Letting outsiders read and write the object's fields directly would break encapsulation.",
    "You need an all-or-nothing change: save first, try a series of steps, and restore if one fails.",
  ],
  whenNotToUse: [
    "The state is large and changes often: full snapshots use a lot of memory. Store only the differences, or use Command-based undo instead.",
    "The state includes outside resources, such as open connections or files, that cannot be copied into a snapshot.",
  ],
  pros: [
    "Undo and rollback without exposing the object's internals.",
    "The originator stays simple: the caretaker manages the history.",
    "Immutable snapshots are safe to share and easy to test.",
  ],
  cons: [
    "Many snapshots cost memory; the caretaker must limit or prune the history.",
    "In Python nothing stops the caretaker from peeking inside a memento; it is only a convention.",
  ],
  confusedWith: [
    { name: "Command", difference: "Command stores the operation and reverses it; Memento stores the state and restores it. Many editors use both: commands for small edits, snapshots for big ones." },
    { name: "Prototype", difference: "Prototype copies an object to create a new one; Memento copies the state so the same object can go back to it later." },
  ],
  solid:
    "Single Responsibility: keeping history is separate from editing. Encapsulation is preserved, because callers depend only on save() and restore(), never on the fields.",
  interviewUses: [
    "Text editor with undo and redo.",
    "Drawing app with a limited undo history.",
    "Game save system.",
    "Shopping cart \"restore\" and configuration rollback.",
  ],
  examples: [
    {
      id: "canvas",
      domain: "Design tools",
      title: "Drawing canvas with limited undo",
      situation:
        "A drawing app lets users add shapes and change colours. Users want undo, but keeping a snapshot of every single step forever would slowly eat all the memory on a phone.",
      roles: [
        { role: "Originator", name: "Canvas" },
        { role: "Memento", name: "CanvasSnapshot" },
        { role: "Caretaker", name: "UndoStack" },
        { role: "Client", name: "Demo code" },
      ],
      why: "The canvas snapshots its own shapes and fill colour, so the undo stack never needs to know how a canvas is built. The caretaker is the natural place to decide how many snapshots to keep.",
      goodToKnow:
        "A size limit is the simplest pruning rule. A deque with maxlen in Python, or take(limit) on a list in Scala, drops the oldest snapshot automatically.",
      walkthrough: [
        "Before each of five shapes is added, the demo pushes a snapshot onto an undo stack that holds only three.",
        "One more snapshot is pushed, then the fill changes to saffron.",
        "The stack now holds just the three newest snapshots; the older ones were dropped.",
        "Each undo pops a snapshot and the canvas restores itself from it.",
        "After three undos the canvas still shows three shapes and there is nothing left to undo, because the earliest steps were pruned.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "cart",
      domain: "E-commerce",
      title: "All-or-nothing coupons",
      situation:
        "At checkout a shopper enters several coupon codes at once. If one code is invalid, the cart must not be left half-changed with some discounts applied and others not.",
      roles: [
        { role: "Originator", name: "Cart" },
        { role: "Memento", name: "CartMemento" },
        { role: "Caretaker", name: "apply_all_or_nothing" },
        { role: "Client", name: "Demo code" },
      ],
      why: "A memento works like a small transaction: take a checkpoint, try every step, and restore the checkpoint if anything fails. The cart does not need any special undo logic for each coupon.",
      goodToKnow:
        "The caretaker here is a function, not a class. A caretaker is just whoever holds the snapshot for a while.",
      walkthrough: [
        "The cart holds a ₹1,499 kurta and ₹79 shipping, so the total is ₹1,578.",
        "apply_all_or_nothing saves a checkpoint, then applies FLAT100 and FREESHIP.",
        "DIWALI90 is not valid, so an error is raised halfway through.",
        "The caretaker restores the checkpoint and the total is back to ₹1,578.",
        "The second try uses only valid codes and the total becomes ₹1,399.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "config",
      domain: "DevOps",
      title: "Config rollback by release",
      situation:
        "A service's settings change with each release, and sometimes a hotfix breaks production. The on-call engineer needs to roll back to the settings of a named release in one step.",
      roles: [
        { role: "Originator", name: "ServiceConfig" },
        { role: "Memento", name: "ConfigCheckpoint" },
        { role: "Caretaker", name: "ReleaseLog" },
        { role: "Client", name: "Demo code" },
      ],
      why: "Each checkpoint is a frozen copy of the settings, tagged with a release label. The release log looks them up by name instead of by position, so you can jump back to any release, not only the last one.",
      goodToKnow:
        "A memento may carry a little public metadata, such as a label or timestamp, that the caretaker can read. The settings themselves stay for the originator only.",
      walkthrough: [
        "The service starts on api:1.4 with two replicas, and a v1.4 checkpoint is kept.",
        "The release to api:1.5 raises replicas to four, and a v1.5 checkpoint is kept.",
        "A bad hotfix cuts the timeout to 50 ms.",
        "Rolling back to v1.5 restores the 800 ms timeout.",
        "Rolling back to v1.4 restores the original image and replica count.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "game",
      domain: "Games",
      title: "Undo and redo in a puzzle game",
      situation:
        "In a grid puzzle the player often makes a wrong move and wants to take it back, and sometimes changes their mind and wants to redo it.",
      roles: [
        { role: "Originator", name: "Player" },
        { role: "Memento", name: "GameSave" },
        { role: "Caretaker", name: "UndoRedo" },
        { role: "Client", name: "Demo code" },
      ],
      why: "Undo and redo are just two stacks of snapshots. Before moving in either direction the caretaker saves the current state onto the other stack, so the player can always go back.",
      goodToKnow:
        "Any new move must clear the redo stack. Otherwise redo would jump to a future that no longer matches what the player did.",
      walkthrough: [
        "The player moves right, right and up, ending at (2,1) after three moves.",
        "Two undos pop two snapshots and the player is back at (1,0).",
        "Redo moves the player forward again to (2,0).",
        "A new move left clears the redo stack.",
        "The next redo does nothing, so the player stays at (1,0).",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
