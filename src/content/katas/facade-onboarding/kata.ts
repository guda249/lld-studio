import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "facade-onboarding",
  slug: "facade",
  title: "One call to onboard a new hire",
  domain: "HR onboarding",
  difficulty: 1,
  task: "onboard_engineer() and onboard_designer() each run the same three-step sequence across the directory, laptop desk and badge office. IT now wants a VPN account created before the laptop is handed over, which means editing every copy. Refactor it so callers make one call and the sequence lives in one place.",
  goals: [
    "An OnboardingFacade class that receives Directory, LaptopDesk and BadgeOffice through its constructor",
    "One onboard() method that calls the three services in the right order",
    "The facade only coordinates: the services still do the real work",
    "Callers use the facade and no longer repeat the sequence themselves"
  ],
  hints: [
    "Put the two onboarding functions side by side. What differs? Only the team, the laptop model and the floors.",
    "Make a class that holds the three services, and move the sequence into one of its methods, with the differences as parameters.",
    "Write OnboardingFacade(directory, laptops, badges) with onboard(name, team, model, floors), then replace both functions with two calls to it."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
