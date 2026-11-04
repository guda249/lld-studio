import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "state",
  task: "Order checks its status string with if/elif in ship, deliver and cancel, so the rules for one status are spread over every method and a new status means editing all of them. Refactor it into the State pattern so each status lives in its own class and a new status can be added without touching the others.",
  goals: [
    "One state type (a base class, ABC or trait) that declares ship, deliver and cancel",
    "A class for each status (placed, shipped, delivered, cancelled) that extends it",
    "Order holds the current state and hands every action to it, with no status checks",
    "The states decide the next state (return it, or set it on Order), not Order",
    "Actions that aren't allowed in a state are refused with a clear error, never silently ignored"
  ],
  hints: [
    "List the statuses. Each one will become a class; the actions they share become the methods of one base type.",
    "Give the base type a default for every action that refuses it (raise an error). Then each state only overrides the actions it allows.",
    "Make each allowed action return the next state, and write Order's methods as one line each, e.g. self._state = self._state.ship() in Python or state = state.ship in Scala."
  ]
};

export default exercise;
