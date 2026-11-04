import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "builder-email",
  slug: "builder",
  title: "Emails without the argument soup",
  domain: "Team email",
  difficulty: 1,
  task: "Email takes seven positional arguments, three of them lists of addresses. Someone already put the audit address in cc instead of bcc, and now marketing wants reply-to and attachments too. Refactor it so every part of an email is set by name and build() refuses an email with no recipient.",
  goals: [
    "An EmailBuilder class that starts from defaults (no cc, no bcc, not urgent)",
    "One step method per setting (to, cc, bcc, subject, body, urgent), each returning the builder so calls chain",
    "build() checks the rule (at least one recipient) and returns a finished Email",
    "Email is immutable once built (a frozen dataclass in Python, a case class in Scala)",
    "The demo creates every Email through the builder, never with the long constructor"
  ],
  hints: [
    "Look at the demo: can you tell which empty list is cc and which is bcc without counting commas?",
    "Make a separate class that remembers each setting with a default, and give it one small method per setting that ends with return self (this in Scala).",
    "Add build() that raises ValueError (require in Scala) when the recipient list is empty, then returns Email(...). Turn Email into a frozen dataclass / case class."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
