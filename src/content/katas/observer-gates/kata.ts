import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "observer-gates",
  slug: "observer",
  title: "Gate changes that anyone can listen to",
  domain: "Airport operations",
  difficulty: 1,
  task: "Flight creates the gate screen and the SMS service itself and calls each one by name when the gate changes. The airport now wants the boarding app and the cleaning crew's tablet to hear about gate changes too, and each one means editing Flight. Refactor it so listeners subscribe from outside.",
  goals: [
    "A GateListener interface (an ABC in Python, a trait in Scala) with one gate_changed method",
    "GateScreen and SmsService implement GateListener",
    "Flight keeps a list of GateListener, with subscribe and unsubscribe",
    "change_gate loops over the list; Flight never creates or names a concrete listener"
  ],
  hints: [
    "GateScreen.show and SmsService.text_passengers take the same two values. Give them one shared method name.",
    "Put that method in a GateListener interface, and replace Flight's two fields with one list of GateListener.",
    "Add subscribe and unsubscribe to Flight, loop over the list in change_gate, and move GateScreen() and SmsService() into the demo, where they are subscribed."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
