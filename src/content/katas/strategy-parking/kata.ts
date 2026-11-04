import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "strategy-parking",
  slug: "strategy",
  title: "Parking rates without the if/elif",
  domain: "Parking garage",
  difficulty: 1,
  task: "ParkingMeter.fee picks the pricing rule with if/elif on a plan name. The garage is adding an evening rate and an electric-car rate next month, and each one means editing fee() again. Refactor it so each rate plan is its own class and the meter just asks its plan.",
  goals: [
    "A RatePlan interface (an ABC in Python, a trait in Scala) with one fee(hours) method",
    "Hourly, DayPass and Resident each implement RatePlan",
    "ParkingMeter holds a RatePlan (typed as the interface), given from outside, and calls it",
    "The plan can be swapped with a setter; no if/elif on the plan name is left"
  ],
  hints: [
    "Each branch of fee() is a separate pricing rule. What do the branches have in common?",
    "Give every rule its own class with the same fee(hours) method, behind one RatePlan interface.",
    "Pass the plan object into ParkingMeter's constructor, store it, and make fee() return self._plan.fee(hours). Add set_plan to switch plans later."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
