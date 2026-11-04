import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "iterator-seating",
  slug: "iterator",
  title: "Walk the cinema seats without nested loops",
  domain: "Cinema ticketing",
  difficulty: 1,
  task: "count_free and first_free each walk the nested row lists with their own counters. The cinema is about to store seats per row in a different structure (with gaps for aisles), and every caller would break. Refactor it so callers loop over seats with a plain for loop and only one class knows the layout.",
  goals: [
    "A SeatIterator class that hands out one seat at a time and remembers its row and column",
    "SeatIterator follows the language's protocol (__iter__ and __next__ in Python, extends Iterator[Seat] in Scala)",
    "SeatingPlan hands out a new SeatIterator each time it is looped over",
    "count_free and first_free use a plain loop (or sum / find) and never mention rows or columns"
  ],
  hints: [
    "Both callers do the same thing: visit every seat in order. Only what they do with each seat differs.",
    "Move the row/column counters into a SeatIterator class whose next method returns the next seat and moves forward.",
    "Give SeatingPlan an __iter__ (Python) or iterator (Scala, with extends Iterable[Seat]) that returns SeatIterator(self), then rewrite the callers as simple loops."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
