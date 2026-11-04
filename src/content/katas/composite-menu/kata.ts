import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "composite-menu",
  slug: "composite",
  title: "Combos inside combos on a menu",
  domain: "Restaurant ordering",
  difficulty: 2,
  task: "price_of() and render() each check whether an entry is a Dish or a Combo, and a combo can hold other combos. The kitchen now wants drinks with a bottle deposit and a 'chef's tasting' entry, and each new kind means editing every function. Refactor it so dishes and combos answer the same methods and a combo just asks what is inside it.",
  goals: [
    "A MenuEntry component (an ABC in Python, a trait in Scala) declaring price() and render()",
    "Dish is a leaf that answers from its own data",
    "Combo is a composite: it implements MenuEntry, keeps a list of MenuEntry children and has add()",
    "Combo.price() and Combo.render() build their answers from their children's answers",
    "No isinstance / type match on Dish or Combo left anywhere"
  ],
  hints: [
    "Look at each branch of price_of(): the Dish branch belongs to Dish, the Combo branch belongs to Combo.",
    "Give both classes one shared type with price() and render(). A combo's children should be typed as that shared type, not as Dish.",
    "In Combo, price() becomes sum(e.price() for e in self._entries) times the discount, and render() calls e.render(depth + 1) on each child. Then delete the free functions."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
