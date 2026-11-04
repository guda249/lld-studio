import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "memento-booking",
  slug: "memento",
  title: "A Back button that doesn't pry into the form",
  domain: "Flight booking",
  difficulty: 2,
  task: "BackButton saves and restores the booking form by copying its fields from the outside. The airline is adding a meal choice and a seat map to the form, and each new field will be silently lost when the traveller presses Back unless someone remembers to edit BackButton too. Refactor it so the form snapshots and restores itself.",
  goals: [
    "A FormSnapshot class holding the form's state that can't change after it is made (frozen dataclass / case class)",
    "BookingForm.save() returns a FormSnapshot, copying the passenger list",
    "BookingForm.restore(snapshot) puts the state back; no other class sets the form's fields",
    "BackButton only stores FormSnapshot objects and hands them back, without reading them",
    "The demo prints the same three lines as before"
  ],
  hints: [
    "Which class knows every field of the form? That class should be the one that copies them.",
    "Turn the tuple into a small read-only FormSnapshot class, and move the copying code from BackButton into BookingForm.save().",
    "Move the restoring code into BookingForm.restore(snapshot). BackButton keeps a list[FormSnapshot] with push and pop, and the demo calls form.restore(back.pop())."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
