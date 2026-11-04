import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "chain-of-responsibility-moderation",
  slug: "chain-of-responsibility",
  title: "Post moderation as a chain of checks",
  domain: "Community forum",
  difficulty: 2,
  task: "moderate() runs every rule in one if/elif chain. The forum wants a profanity check, and a different order for trusted members, so each change means editing the same function again. Refactor it so each rule is its own handler and the client decides the order.",
  goals: [
    "A Moderator handler type (an ABC in Python, an abstract class in Scala) with a handle method",
    "One handler class per rule: empty, banned word, new-account link, length",
    "Each handler keeps the next Moderator (optional) and passes the post on when it has no objection",
    "The client code links the handlers together; no handler creates its own next link",
    "A post that passes every check is published, with the same output as before"
  ],
  hints: [
    "Each branch answers one question about the post and either gives a verdict or says \"not my business\".",
    "Make a base Moderator that holds the next Moderator (or None) and has handle(post): use its own verdict if it has one, otherwise ask the next link.",
    "Write EmptyCheck, BannedWordCheck, NewAccountLinkCheck and LengthCheck, each with only its own rule, and build EmptyCheck(BannedWordCheck(NewAccountLinkCheck(LengthCheck()))) in the demo."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
