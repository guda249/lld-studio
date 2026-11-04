import type { Kata } from "../../extras/types";
import starterPy from "./code/starter.py?raw";
import starterScala from "./code/Starter.scala?raw";
import solutionPy from "./code/solution.py?raw";
import solutionScala from "./code/Solution.scala?raw";

const kata: Kata = {
  id: "decorator-chat",
  slug: "decorator",
  title: "Stackable chat message features",
  domain: "Team chat",
  difficulty: 2,
  task: "Each mix of chat features is its own subclass (FilteredEmojiSender), and the emoji code is already copied twice. Product wants a third feature, trimming extra spaces, in any combination, which would double the number of classes. Refactor it so each feature is a wrapper you can stack in any order at runtime.",
  goals: [
    "A MessageSender component (an ABC in Python, a trait in Scala) with send(text)",
    "PlainSender is the real object that does the sending",
    "A SenderDecorator base that implements MessageSender and receives the MessageSender it wraps",
    "ProfanityFilter and EmojiExpander each change the text and then pass the call on to the wrapped sender",
    "Combinations are built by nesting, e.g. EmojiExpander(ProfanityFilter(PlainSender())), with no class per combination"
  ],
  hints: [
    "Count the classes you'd need for three features in every combination. That growth is the smell.",
    "Instead of inheriting a feature, hold another sender in a field and call it after changing the text.",
    "Write SenderDecorator(inner: MessageSender) whose send() calls inner.send(text). ProfanityFilter and EmojiExpander extend it and call super().send(changed_text)."
  ],
  starter: { python: starterPy, scala: starterScala },
  solution: { python: solutionPy, scala: solutionScala }
};

export default kata;
