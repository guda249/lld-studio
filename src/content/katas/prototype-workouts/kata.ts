import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "prototype-workouts",
  slug: "prototype",
  title: "Workout plans copied from one template",
  domain: "Fitness app",
  difficulty: 2,
  task: "Every member's beginner plan is typed out from scratch with the same exercises and settings. The coach now wants to add a warm-up to the beginner plan, which means hunting down every copy. Refactor it so each member's plan is a copy of one configured template, and changing a copy never touches the template.",
  goals: [
    "A Prototype interface (an ABC in Python, a trait in Scala) that declares duplicate()",
    "WorkoutPlan.duplicate() returns a new plan with its own exercise list and settings (a deep copy)",
    "A PlanLibrary that stores templates and hands out copies, never the template itself",
    "Members' plans are made by copying the template and changing only what differs"
  ],
  hints: [
    "The three plans start identical. What if you built that starting point once and copied it?",
    "Add duplicate() to WorkoutPlan. Watch out: if the copy shares the same list, adding 'plank' for Ana adds it to everyone.",
    "Use copy.deepcopy(self) in Python, or build a new WorkoutPlan with ListBuffer.from(...) and Map.from(...) in Scala. Keep the template in a small library class whose create() calls duplicate()."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
