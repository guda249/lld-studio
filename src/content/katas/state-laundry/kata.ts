import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "state-laundry",
  slug: "state",
  title: "A washing machine without status strings",
  domain: "Laundromat",
  difficulty: 3,
  task: "Every action of WashingMachine checks its status string with if/elif, so the rules for one status are spread over four methods. The owner wants a \"paused\" status and a \"rinse only\" cycle, and each one means editing every method. Refactor it so each status is its own class that knows what it allows and what comes next.",
  goals: [
    "A MachineState base type whose default for every action is a clear refusal",
    "Idle, Paid, Washing and Done each override only the actions they allow",
    "Each state's action returns the next state; WashingMachine never picks the next state itself",
    "WashingMachine holds the current MachineState and hands every action to it, with no status checks",
    "The demo prints the same lines as before"
  ],
  hints: [
    "Read the code by column instead of by row: what does the machine do in each status, across all four actions?",
    "Make one class per status with pay, start, finish and open_door. Put the \"can't X while Y\" message in a shared base class so each state overrides only what it allows.",
    "Let each action return the next state (Idle.pay returns Paid()), and make WashingMachine do self._state = self._state.pay(), and so on, for each action."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
