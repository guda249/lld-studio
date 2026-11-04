import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "command",
  task: "The toolbar, shortcut and menu call Document directly, so nothing remembers what was done and undo is impossible. Refactor it into the Command pattern so every edit is an object an Editor can run and undo.",
  goals: [
    "A Command interface (an ABC in Python, a trait in Scala) with execute and undo",
    "At least two command classes (for example insert and delete) that are given the Document and their values",
    "Each command's undo reverses exactly what its execute did",
    "An Editor (invoker) that runs any Command and keeps a history list for undo",
    "The Editor never creates or checks for a concrete command"
  ],
  hints: [
    "Each direct call on doc (insert, delete_last) becomes one class. What does each one need to remember to do its job later?",
    "Undo needs information: insert can cut its own text off again, but delete must save the text it removed during execute.",
    "Give Editor a history list. run(command) calls command.execute() and appends it; undo() pops the last command and calls its undo()."
  ]
};

export default exercise;
