import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "memento",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What problem does the Memento pattern solve?",
      options: [
        "Letting many objects talk through one central object",
        "Saving and restoring an object's state without exposing its private fields",
        "Undoing an action by running its opposite operation",
        "Creating new objects by copying an existing one"
      ],
      answer: 1,
      hint: "Think of the editor's undo: who reads the private text and cursor in the good version?",
      explain: "Memento lets the originator pack its own state into an immutable snapshot and restore from it, so nobody else touches its fields. Option A is Mediator, C is Command-style undo (it stores operations, not state) and D is Prototype."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Tap the line that breaks the Memento pattern.",
      code: { lang: "python", text: `class History:
    def __init__(self):
        self._stack = []

    def push(self, snapshot):
        self._stack.append(snapshot)

    def undo(self, editor):
        snap = self._stack.pop()
        editor._text = snap.text
        return snap` },
      answer: 10,
      hint: "Who is allowed to put a snapshot's contents back into the editor?",
      explain: "Line 10 makes the caretaker open the snapshot and write the editor's private field itself. History should only hand the snapshot back, and the editor should call restore(snapshot) on itself. Storing (line 6) and popping (line 9) are exactly a caretaker's job."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `final case class FormDraft(fields: Map[String, String])

class SignupForm:
  private var fields = Map.empty[String, String]
  def fill(k: String, v: String): Unit = fields += k -> v
  def draft(): FormDraft = FormDraft(fields)
  def load(d: FormDraft): Unit = fields = d.fields

val drafts = scala.collection.mutable.Stack.empty[FormDraft]` },
      options: ["Prototype", "Command", "Memento", "State"],
      answer: 2,
      hint: "What does draft() return, and who is allowed to read it back in?",
      explain: "SignupForm packs its private fields into an immutable FormDraft and can load one back, while a stack just keeps them: Memento. Prototype would build a new form from a copy, Command would store operations, and State would swap behaviour objects."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A banking app applies three ledger changes in one transfer. If the third fails, the account must look exactly as it did before the transfer started. Which pattern fits best?",
      options: ["Memento", "Observer", "Decorator", "Mediator"],
      answer: 0,
      hint: "You need a checkpoint you can return to if something goes wrong part-way.",
      explain: "Take a memento of the account before the transfer, try the steps, and restore the memento if one fails: an all-or-nothing change, like the coupon example. Observer only notifies, Decorator adds behaviour and Mediator coordinates objects."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of one save and undo in the right order.",
      steps: [
        "The client calls editor.save()",
        "Editor returns a new immutable EditorSnapshot",
        "The client pushes the snapshot onto History",
        "Later, the client pops the snapshot from History",
        "Editor restores its own fields from the snapshot"
      ],
      shuffled: [2, 4, 0, 3, 1],
      hint: "A snapshot has to exist before anyone can keep it, and it has to be kept before it can be given back.",
      explain: "The originator creates the memento, the caretaker keeps it, and on undo the caretaker hands it back so the originator can restore itself. History never reads the snapshot at any point."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows the Memento pattern correctly?",
      options: [
        {
          label: "History holds a link to Editor and reaches into it; there is no snapshot class.",
          width: 330, height: 200,
          nodes: [
            { id: "h", kind: "concrete", name: "History", at: { x: 8, y: 20, w: 110 } },
            { id: "e", kind: "concrete", name: "Editor", key: true, members: ["+ text", "+ cursor"], at: { x: 200, y: 20, w: 120 } }
          ],
          edges: [
            { id: "e1", from: "h", to: "e", type: "association", label: "writes fields" }
          ]
        },
        {
          label: "Snapshot inherits from Editor, and History inherits from Snapshot.",
          width: 330, height: 200,
          nodes: [
            { id: "e", kind: "concrete", name: "Editor", at: { x: 110, y: 14, w: 110 } },
            { id: "s", kind: "concrete", name: "Snapshot", at: { x: 20, y: 140, w: 110 } },
            { id: "h", kind: "concrete", name: "History", at: { x: 200, y: 140, w: 110 } }
          ],
          edges: [
            { id: "e1", from: "s", to: "e", type: "inheritance" },
            { id: "e2", from: "h", to: "s", type: "inheritance" }
          ]
        },
        {
          label: "Editor creates Snapshot (dashed arrow); History keeps many Snapshots (hollow diamond at History).",
          width: 330, height: 200,
          nodes: [
            { id: "e", kind: "concrete", name: "Editor", key: true, at: { x: 8, y: 20, w: 100 } },
            { id: "h", kind: "concrete", name: "History", key: true, at: { x: 222, y: 20, w: 100 } },
            { id: "s", kind: "concrete", name: "Snapshot", key: true, at: { x: 110, y: 140, w: 110 } }
          ],
          edges: [
            { id: "e1", from: "e", to: "s", type: "dependency", label: "creates", via: [[58, 161]] },
            { id: "e2", from: "h", to: "s", type: "aggregation", toMult: "*", via: [[272, 161]] }
          ]
        }
      ],
      answer: 2,
      hint: "The caretaker should hold snapshots, never the originator's fields.",
      explain: "C is right: Editor creates snapshots (dashed dependency) and History aggregates many of them without touching Editor. A is the original problem, where History writes Editor's fields directly. B uses inheritance, which shares code but saves no state."
    }
  ],
  cards: [
    { id: "mm-intent", front: "Memento: what is its intent, in one line?", back: "Capture an object's state in a sealed snapshot so it can be restored later, without exposing its internals." },
    { id: "mm-vs-command", front: "Memento vs Command for undo: what is the difference?", back: "Memento stores the state and puts it back. Command stores the operation and runs its reverse. Many editors use both." },
    { id: "mm-solid", front: "Which design principles does Memento mainly protect?", back: "Encapsulation (only the originator reads its snapshot) and Single Responsibility (the caretaker keeps history, the originator edits)." },
    { id: "mm-spot", front: "Which pattern is hiding here?", code: { lang: "python", text: "savepoint = conn.execute(\"SAVEPOINT before_import\")\n# ... many inserts ...\nconn.execute(\"ROLLBACK TO SAVEPOINT before_import\")" }, back: "Memento. The database snapshots its own state at the savepoint, and you only hold the name; rolling back restores it." },
    { id: "uml-dep", front: "UML: what does a dashed line with an open arrowhead mean?", back: "Dependency: one class uses another briefly, for example Editor creates and returns an EditorSnapshot but does not keep it as a field." },
    { id: "mm-when-not", front: "When should you NOT use Memento?", back: "When the state is large and changes often (full snapshots waste memory; store differences or use Command), or when it holds things you cannot copy, like open connections." }
  ]
};

export default quiz;
