import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "command",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What is the core idea of the Command pattern?",
      options: [
        "Swap one algorithm for another behind an interface",
        "Turn a request into an object, so it can be stored, queued, logged or undone",
        "Give a complex subsystem one simple front door",
        "Save an object's state so it can be restored later"
      ],
      answer: 1,
      hint: "Think of the restaurant order slip: what can you do with the slip that you could not do with a shouted order?",
      explain: "A command object packs the action and its parameters, so an invoker can run it now, later, again, or reverse it. Swapping algorithms is Strategy, a simple front door is Facade, and saving state snapshots is Memento."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Undo puts back the wrong text. Tap the line that causes it.",
      code: { lang: "scala", text: `class DeleteLastChars(doc: Document, count: Int) extends Command:
  private var deleted = ""

  def execute(): Unit =
    doc.text = doc.text.dropRight(count)
    deleted = doc.text.takeRight(count)

  def undo(): Unit = doc.text = doc.text + deleted` },
      answer: 6,
      hint: "Read execute() from top to bottom. When is the deleted text saved?",
      explain: "Line 6 saves the text after it has already been removed, so it remembers the wrong characters. Save takeRight(count) first, then drop it; undo can then put back exactly what was deleted."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Python code use?",
      code: { lang: "python", text: `class Transfer:
    def __init__(self, bank, src, dst, amount):
        self.bank, self.src, self.dst, self.amount = bank, src, dst, amount

    def execute(self):
        self.bank.move(self.src, self.dst, self.amount)

    def undo(self):
        self.bank.move(self.dst, self.src, self.amount)

queue.append(Transfer(bank, "A-17", "B-02", 5000))` },
      options: ["Strategy", "Memento", "Command", "Observer"],
      answer: 2,
      hint: "Look at what goes into the queue, and at the pair of methods it offers.",
      explain: "Transfer is a request turned into an object with execute() and undo(), placed in a queue to run later: Command. It is not an interchangeable algorithm (Strategy), it stores no state snapshot (Memento), and nothing is notified (Observer)."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A drawing app needs undo and redo for every tool, and a \"replay\" feature that repeats the user's last 20 actions on a new canvas. Which pattern fits best?",
      options: ["Command", "Decorator", "Template Method", "Facade"],
      answer: 0,
      hint: "Undo, redo and replay all need a list of actions you can run again or reverse.",
      explain: "Each tool action becomes a command object kept on a history stack, so it can be undone, redone or replayed on another canvas. Decorator adds behaviour by wrapping, Template Method fixes the steps of one algorithm, and Facade only simplifies an interface."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of an undo in the editor in the right order.",
      steps: [
        "The user presses Undo, and the Editor's undo() is called",
        "The Editor pops the newest command off its history",
        "The Editor calls undo() on that command",
        "The command reverses its change on the Document"
      ],
      shuffled: [2, 3, 0, 1],
      hint: "The invoker owns the history; the command owns the knowledge of how to reverse itself.",
      explain: "The invoker (Editor) receives the request, takes the last command from its stack, and asks it to undo. Only the command knows how to reverse its change on the receiver (Document)."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows the Command pattern correctly?",
      options: [
        {
          label: "Editor keeps a history of Command; InsertText implements Command and changes the Document.",
          width: 330, height: 200,
          nodes: [
            { id: "e", kind: "concrete", name: "Editor", key: true, members: ["- history"], at: { x: 8, y: 14, w: 100 } },
            { id: "c", kind: "interface", name: "Command", members: ["+ execute()"], at: { x: 170, y: 8, w: 150 } },
            { id: "i", kind: "concrete", name: "InsertText", at: { x: 185, y: 140, w: 120 } },
            { id: "d", kind: "concrete", name: "Document", at: { x: 8, y: 140, w: 110 } }
          ],
          edges: [
            { id: "e1", from: "e", to: "c", type: "association" },
            { id: "e2", from: "i", to: "c", type: "realization" },
            { id: "e3", from: "i", to: "d", type: "association" }
          ]
        },
        {
          label: "Editor calls Document directly; Document has insert and delete methods.",
          width: 330, height: 200,
          nodes: [
            { id: "e", kind: "concrete", name: "Editor", key: true, members: ["+ onClick()"], at: { x: 8, y: 20, w: 110 } },
            { id: "d", kind: "concrete", name: "Document", members: ["+ insert(s)", "+ delete(n)"], at: { x: 180, y: 20, w: 140 } }
          ],
          edges: [
            { id: "e1", from: "e", to: "d", type: "dependency" }
          ]
        },
        {
          label: "InsertText and DeleteText inherit from Document.",
          width: 330, height: 200,
          nodes: [
            { id: "d", kind: "concrete", name: "Document", key: true, members: ["+ execute()"], at: { x: 100, y: 14, w: 130 } },
            { id: "i", kind: "concrete", name: "InsertText", at: { x: 8, y: 140, w: 140 } },
            { id: "x", kind: "concrete", name: "DeleteText", at: { x: 182, y: 140, w: 140 } }
          ],
          edges: [
            { id: "e1", from: "i", to: "d", type: "inheritance" },
            { id: "e2", from: "x", to: "d", type: "inheritance" }
          ]
        }
      ],
      answer: 0,
      hint: "Look for three separate roles: who runs the request, the request object, and who really changes.",
      explain: "A is right: the invoker (Editor) holds Commands, the concrete command implements the interface and calls its receiver (Document). B is the original problem: direct calls, so no history. C makes the commands subclasses of the receiver, mixing the request with the object it changes."
    }
  ],
  cards: [
    { id: "cmd-intent", front: "Command: what is its intent, in one line?", back: "Wrap a request in an object, so you can pass it around, queue it, log it, and undo or redo it." },
    { id: "cmd-vs-strategy", front: "Command vs Strategy: what is the difference?", back: "Strategy is how to do one job (interchangeable algorithms). Command is what to do, packed as a request that can be stored and run later." },
    { id: "cmd-solid", front: "Which SOLID principles does Command apply?", back: "Single Responsibility (one action per command), Open/Closed (new commands need no change to the invoker) and Dependency Inversion (the invoker knows only the Command interface)." },
    { id: "cmd-spot", front: "Which pattern is hiding in this code?", code: { lang: "scala", text: `val jobs = mutable.Queue[() => Unit]()
jobs.enqueue(() => sendSms("+91-98450-00000"))
jobs.enqueue(() => makeInvoice(1042))
while jobs.nonEmpty do jobs.dequeue()()` }, back: "Command, in its lightest form: each function with no arguments is a request stored now and run later." },
    { id: "cmd-uml", front: "UML: how do you show that the Invoker keeps many commands?", back: "A solid association arrow from Invoker to the Command interface, with multiplicity 0..* at the Command end (the history)." },
    { id: "cmd-when-not", front: "When should you NOT use Command?", back: "For a simple direct call with no undo, queueing, logging or history. One class per action would only add noise." }
  ]
};

export default quiz;
