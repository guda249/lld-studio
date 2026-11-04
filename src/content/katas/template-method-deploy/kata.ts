import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "template-method-deploy",
  slug: "template-method",
  title: "One deploy recipe, many projects",
  domain: "Release pipelines",
  difficulty: 2,
  task: "ApiDeploy and WebsiteDeploy each copy the whole checkout, build, test, upload recipe. The team must add a security scan before every upload, and with copied recipes someone will forget one of them. Refactor it so the recipe is written once and each project supplies only the steps that differ.",
  goals: [
    "A Deploy base class whose run(version) is the template method and holds the order of steps",
    "build is abstract: every project must say how it builds",
    "test is a hook with a default (\"none for this project\") that projects may override",
    "ApiDeploy and WebsiteDeploy fill in only their own steps and never redefine run",
    "The demo prints the same lines as before"
  ],
  hints: [
    "Put the two run methods side by side. Which lines are the same, and which differ?",
    "Move the shared lines into a base class's run, and turn each differing line into a call to a step method.",
    "Make build abstract (@abstractmethod / no body), give test a default body, and let each subclass override only what it needs. A security scan later is one new line in Deploy.run."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
