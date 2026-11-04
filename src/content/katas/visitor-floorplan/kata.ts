import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "visitor-floorplan",
  slug: "visitor",
  title: "New floor-plan reports without touching the spaces",
  domain: "Facility management",
  difficulty: 3,
  task: "Room, Corridor and Staircase each carry area and cleaning_minutes, so every new report means editing every space class. Facilities wants paint estimates and a fire-exit check next. Refactor it so a new report is one new class and the space classes stay untouched.",
  goals: [
    "A SpaceVisitor interface with one visit method per space: visit_room, visit_corridor, visit_staircase",
    "Space declares accept(visitor), and each space's accept calls its own visit method (double dispatch)",
    "AreaVisitor and CleaningVisitor hold the two operations and handle every kind of space",
    "Room, Corridor and Staircase keep only their data and accept; no isinstance or match on the space type",
    "The demo prints the same totals as before"
  ],
  hints: [
    "Group the code by operation instead of by space: all the area rules together, all the cleaning rules together.",
    "Each group becomes a class with one method per space: visit_room(room), visit_corridor(corridor), visit_staircase(stairs).",
    "Replace area and cleaning_minutes in the spaces with accept(visitor), which calls visitor.visit_room(self) (and so on). The demo sums space.accept(AreaVisitor())."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
