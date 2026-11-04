import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "memento",
  task: "History reaches into Editor's private fields to back up and undo, so Editor can't hide its state and any new field is silently forgotten. Refactor it into the Memento pattern so Editor saves and restores itself and History only keeps the snapshots.",
  goals: [
    "A snapshot class that holds the editor's state and can't be changed (a frozen dataclass in Python, a case class in Scala)",
    "Editor has save() that returns a new snapshot, copying any lists or dicts",
    "Editor has restore(snapshot) that puts the state back",
    "History only stores and returns snapshots; it never reads or writes Editor's fields"
  ],
  hints: [
    "Who knows best what Editor's state is? Editor itself. Let it do the copying.",
    "Create an EditorSnapshot with text and cursor, and give Editor save() -> EditorSnapshot and restore(snapshot).",
    "Change History to keep a list of EditorSnapshot with push(snapshot) and pop(); the client calls history.push(editor.save()) and editor.restore(history.pop())."
  ]
};

export default exercise;
