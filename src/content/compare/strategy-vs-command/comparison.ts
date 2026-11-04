import type { Comparison } from "../../extras/types";
import strategyPy from "./code/strategy.py?raw";
import strategyScala from "./code/Strategy.scala?raw";
import commandPy from "./code/command.py?raw";
import commandScala from "./code/Command.scala?raw";

const comparison: Comparison = {
  id: "strategy-vs-command",
  title: "Strategy vs Command",
  tagline: "Both turn a piece of behaviour into an object behind one method, so the class diagrams look almost the same.",
  scenario:
    "A small text editor can change the case of text: UPPER CASE or Title Case. " +
    "In the Strategy version the user picks a heading style in Settings, and the editor applies it to every heading. " +
    "In the Command version each toolbar click is a change to the document that can be undone.",
  decidingQuestion: "Are you choosing how something is done (and reusing that choice), or recording one request that was made (so you can run it later or undo it)?",
  sides: [
    {
      slug: "strategy",
      oneLiner: "Editor holds the CaseStyle the user picked and uses it for every heading until the setting changes.",
      code: { python: strategyPy, scala: strategyScala },
      uml: {
        classes: [
          { name: "Editor", kind: "concrete", members: ["- style: CaseStyle", "+ set_style(style)", "+ format_heading(text)"] },
          { name: "CaseStyle", kind: "interface", members: ["+ apply(text): str"] },
          { name: "UpperCase", kind: "concrete", members: ["+ apply(text): str"] },
          { name: "TitleCase", kind: "concrete", members: ["+ apply(text): str"] }
        ],
        relations: [
          { from: "Editor", to: "CaseStyle", type: "association" },
          { from: "UpperCase", to: "CaseStyle", type: "realization" },
          { from: "TitleCase", to: "CaseStyle", type: "realization" }
        ]
      },
      howItWorks: [
        "The client gives Editor a CaseStyle (TitleCase at first).",
        "Every format_heading() call asks the same style object to do the work, so it is used many times.",
        "When the user changes the setting, set_style() swaps in UpperCase; nothing remembers what happened before."
      ],
      pickWhen: [
        "There are several ways to do one job, and the caller or a setting picks one.",
        "The chosen algorithm is reused for many calls, on different data.",
        "You want to remove an if/elif that picks the algorithm."
      ]
    },
    {
      slug: "command",
      oneLiner: "Each click becomes an EditCommand that knows its Document, changes it, and can put it back.",
      code: { python: commandPy, scala: commandScala },
      uml: {
        classes: [
          { name: "EditHistory", kind: "concrete", members: ["- done: list[EditCommand]", "+ run(command)", "+ undo_last()"] },
          { name: "EditCommand", kind: "interface", members: ["+ execute()", "+ undo()"] },
          { name: "UpperCaseCommand", kind: "concrete", members: ["- doc: Document", "- before: str"] },
          { name: "TitleCaseCommand", kind: "concrete", members: ["- doc: Document", "- before: str"] },
          { name: "Document", kind: "concrete", members: ["+ text: str"] }
        ],
        relations: [
          { from: "EditHistory", to: "EditCommand", type: "aggregation" },
          { from: "UpperCaseCommand", to: "EditCommand", type: "realization" },
          { from: "TitleCaseCommand", to: "EditCommand", type: "realization" },
          { from: "UpperCaseCommand", to: "Document", type: "association" },
          { from: "TitleCaseCommand", to: "Document", type: "association" }
        ]
      },
      howItWorks: [
        "Each click creates a new command object holding the Document it will change.",
        "EditHistory runs it with execute(), and the command saves the old text before changing it.",
        "EditHistory keeps the command in a list; undo_last() pops it and calls undo(), which puts the old text back."
      ],
      pickWhen: [
        "You need undo, redo, a history, a queue, or to retry an action later.",
        "Each object stands for one request with its own data (which document, which values).",
        "The code that triggers an action (a button, a shortcut) should not know what the action does."
      ]
    }
  ],
  table: [
    { aspect: "What the object stands for", values: ["A way of doing a job (an algorithm)", "One request that was made (an action)"] },
    { aspect: "How many objects", values: ["One per algorithm, reused for many calls", "A new one for every request"] },
    { aspect: "What it holds", values: ["Usually nothing: data comes in as arguments", "Its receiver (the Document) and what it needs to undo"] },
    { aspect: "Who keeps it", values: ["The context (Editor), until it is swapped", "The invoker (EditHistory), in a list"] },
    { aspect: "Main method", values: ["apply(text) returns a result", "execute() changes the receiver; undo() reverses it"] },
    { aspect: "Typical smell it fixes", values: ["An if/elif that picks the algorithm", "Actions that can't be undone, queued or logged"] }
  ],
  mixups: [
    "Adding undo() to a strategy: a strategy has no memory of past calls, so there is nothing to undo. If you need undo, you want commands with a history.",
    "A \"command\" with no receiver and no data that gets reused for every call is a strategy in disguise. Look for a single instance stored in a field and called many times.",
    "Creating a new strategy object for every call and keeping them in a list: you have built a command history without undo. Decide which one you need.",
    "Calling the strategy's method execute() makes it look like Command. Name the method after the job (apply, price, sort) to make the intent clear."
  ],
  quiz: [
    {
      type: "mcq", tag: "Concept", prompt: "Which statement best separates Strategy from Command?",
      options: [
        "A strategy is an algorithm you choose and reuse; a command is one request you can store, queue or undo",
        "A strategy always has an undo method; a command never does",
        "A command is chosen by a setting; a strategy is created by each button click",
        "Strategy needs inheritance; Command works only with functions"
      ],
      answer: 0,
      hint: "Count the objects: one reused many times, or one per request?",
      explain: "Strategy objects are the different ways to do a job, and one is reused for many calls. A command object is one request with its own data, which is why it can be kept in a history and undone. The other options swap the roles or are simply wrong."
    },
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "A drawing app lets the user press Ctrl+Z to reverse the last 20 moves, resizes and colour changes. Which pattern fits best?",
      options: ["Strategy", "Command", "Template Method", "State"],
      answer: 1,
      hint: "Something must remember each change that was made, in order.",
      explain: "Each move, resize and colour change becomes a command that knows its shape and its old values, and a history list lets you undo them one by one. A strategy picks an algorithm but remembers nothing; Template Method and State solve other problems."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A map app computes routes by car, bike or on foot. The user picks a mode once and then asks for many routes. Which pattern fits best?",
      options: ["Command", "Strategy", "Facade"],
      answer: 1,
      hint: "Is anything being undone or queued here?",
      explain: "The mode is an algorithm chosen once and reused for every route: Strategy. Nothing is recorded or undone, so Command adds nothing, and a Facade simplifies several classes rather than swapping an algorithm."
    },
    {
      type: "bug", tag: "Find the problem",
      prompt: "Undo restores the wrong text after two clicks. Tap the line that causes it.",
      code: { lang: "python", text: `class EditHistory:
    def __init__(self) -> None:
        self._done: list[EditCommand] = []

    def run(self, command: EditCommand) -> None:
        command.execute()
        self._done.append(command)

    def undo_last(self) -> None:
        if self._done:
            self._done[0].undo()` },
      answer: 11,
      hint: "Which command was run most recently, and where is it in the list?",
      explain: "Line 11 undoes the first command in the list, not the last one. Undo must reverse the newest change first, so use self._done.pop().undo(). The append on line 7 is correct."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of clicking UPPER CASE and then Undo in order (Command version).",
      steps: [
        "The click creates UpperCaseCommand(doc)",
        "EditHistory.run() calls execute()",
        "The command saves the old text and makes it upper case",
        "EditHistory adds the command to its list",
        "Undo pops the command and calls undo(), which restores the old text"
      ],
      shuffled: [3, 1, 4, 0, 2],
      hint: "The old text must be saved before it is changed.",
      explain: "The command is created with its document, run by the invoker, saves the old text before changing it, and is then kept in the history. Undo takes the newest command and reverses it."
    }
  ]
};

export default comparison;
