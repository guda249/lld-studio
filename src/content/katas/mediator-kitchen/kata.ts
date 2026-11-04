import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "mediator-kitchen",
  slug: "mediator",
  title: "A kitchen pass instead of stations peeking at each other",
  domain: "Restaurant kitchen",
  difficulty: 3,
  task: "The grill and the fryer each hold a link to the other and to the waiter, and each peeks into the other's cooking set to decide when a table can be served. The owner wants a drinks bar too: with this design every station must learn about every other one. Refactor it so stations and the waiter talk only to one kitchen object that owns the \"serve when everything is ready\" rule.",
  goals: [
    "A Kitchen mediator interface (an ABC in Python, a trait in Scala) with order and dish_ready",
    "A KitchenPass class implements it, keeps the stations and the waiter, and decides when to serve",
    "Stations and the waiter hold only a Kitchen link, never a link to each other",
    "Adding a new station is one more add_station call, with no edits to the other classes",
    "The demo prints the same lines as before"
  ],
  hints: [
    "Draw who knows whom today: every arrow between Grill, Fryer and Waiter is a dependency. Which object could sit in the middle?",
    "Grill and Fryer differ only in a name and a dish. One Station class with those two values is enough once the peeking is gone.",
    "Make a Kitchen interface and a KitchenPass that remembers, per table, which stations are still cooking. Station.finish just calls kitchen.dish_ready(name, table), and KitchenPass calls waiter.serve when the set is empty."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
