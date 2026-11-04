import type { Guide } from "../guides/types";
import beforePy from "./code/pattern-overuse-before.py?raw";
import beforeScala from "./code/pattern-overuse-before.scala?raw";
import afterPy from "./code/pattern-overuse-after.py?raw";
import afterScala from "./code/pattern-overuse-after.scala?raw";
import middlePy from "./code/pattern-overuse-middle.py?raw";
import middleScala from "./code/pattern-overuse-middle.scala?raw";

const guide: Guide = {
  section: "anti",
  id: "pattern-overuse",
  order: 3,
  title: "Pattern overuse",
  short: "Interfaces, factories and strategies where a function, a dict or an if would do.",
  lede:
    "Right after learning design patterns, everything looks like a place for one. **Pattern overuse** is building the " +
    "machinery of a pattern for a problem that doesn't need it yet. Its close cousin is **speculative generality**: " +
    "code that is flexible in ways nobody has asked for (\"in case we add plugins later\").",
  blocks: [
    {
      type: "text",
      text:
        "The idea in plain words: a pattern is a cost you pay to buy a kind of flexibility. Every interface, factory and " +
        "extra class is more to read, name, test and jump between. That cost is worth it when the flexibility is used " +
        "today, or the change is clearly coming. When the \"variants\" are only different numbers, a **dict** is enough. " +
        "When there are two cases, an **if** is enough. When a class has one method and no state, a **function** is enough."
    },
    {
      type: "list",
      title: "What it looks like",
      style: "crosses",
      items: [
        "An interface with exactly one implementation, and no test double either (\"for future flexibility\").",
        "Several classes whose only difference is the value they return.",
        "A factory or registry that is called from one place with a hard-coded key.",
        "Parameters, hooks or abstract base classes that every caller passes the same value to, or never overrides.",
        "Names that stack pattern words: a `FeeStrategyFactory` that builds a `FeeStrategyProvider`.",
        "A State pattern for an object with two states and one transition."
      ]
    },
    {
      type: "callout",
      tone: "warn",
      title: "The change request that exposes it",
      text:
        "\"Raise the metro fee to 50, and make shipping free above 999.\" In the over-built version, the first change is " +
        "hidden in `MetroFee`, and the second has no obvious home: it applies to every zone, so you either copy it into three " +
        "classes or add a base class just for it. A newcomer must read five types to change one number."
    },
    {
      type: "compare",
      before: {
        title: "Before: Strategy + Factory for a lookup table",
        text:
          "Three classes that each return a constant, an interface over them, and a factory with a registry \"for plugins\". " +
          "The free-shipping rule cuts across all of them, so the structure fights the change.",
        code: { python: beforePy, scala: beforeScala },
        uml: {
          classes: [
            { name: "ShippingFeeFactory", kind: "concrete", members: ["+ create(zone)"] },
            { name: "ShippingFeeStrategy", kind: "interface", members: ["+ fee(total)"] },
            { name: "MetroFee", kind: "concrete", members: ["+ fee(total)"] },
            { name: "TownFee", kind: "concrete", members: ["+ fee(total)"] },
            { name: "RemoteFee", kind: "concrete", members: ["+ fee(total)"] }
          ],
          relations: [
            { from: "MetroFee", to: "ShippingFeeStrategy", type: "realization" },
            { from: "TownFee", to: "ShippingFeeStrategy", type: "realization" },
            { from: "RemoteFee", to: "ShippingFeeStrategy", type: "realization" }
          ]
        }
      },
      after: {
        title: "After: a dict and an if",
        text:
          "The fees are data, so they live in a dict. The free-shipping rule is one `if` at the top of one function. " +
          "Both changes are one-line edits in one place, and the whole design fits on a screen.",
        code: { python: afterPy, scala: afterScala }
      }
    },
    {
      type: "code",
      title: "The middle step: functions before classes",
      code: { python: middlePy, scala: middleScala },
      note:
        "When zones start to need different rules, not just different numbers, the next step is a dict of functions. " +
        "That is already the Strategy pattern, in its lightest form. Move to classes only when a rule needs its own state, several methods, or its own tests and settings."
    },
    {
      type: "list",
      title: "How to spot it in code",
      style: "plain",
      items: [
        "**Count implementations.** An interface with one implementation (and no fake in tests) is speculative.",
        "**Look for classes that are just values.** If each subclass returns a constant, replace them with a table.",
        "**Follow the factory.** If every call passes a literal key, the factory adds a hop and no choice.",
        "**Try the delete test.** Inline the abstraction in your head. If the code gets shorter and no caller loses anything, it wasn't earning its place.",
        "**Ask \"which change request made us add this?\"** If the answer is \"none yet\", it's speculative generality."
      ]
    },
    {
      type: "callout",
      tone: "tip",
      title: "When the pattern is right",
      text:
        "Reach for the full pattern when the variants have real behaviour and state, when other teams or plugins must add " +
        "variants without editing your code, when you need a test double, or when the third similar case shows up (the " +
        "**rule of three**: write it once, copy it twice, abstract on the third). Under-using patterns is a smell too: " +
        "a 200-line `if/elif` over zones with different rules is exactly where Strategy pays off."
    },
    {
      type: "list",
      title: "Principles that fix it",
      style: "ticks",
      items: [
        "**YAGNI** (\"You Aren't Gonna Need It\"): build for today's requirements; the code can grow when the need is real.",
        "**KISS** (\"Keep It Simple\"): the simplest thing that works is easiest to change later, too.",
        "**Refactor toward patterns:** start with a function or a dict and move to the pattern when a change request asks for it.",
        "**Open/Closed, used wisely:** close the code against the changes that actually happen, not every change you can imagine."
      ]
    },
    {
      type: "patterns",
      title: "Patterns most often over-used, and their lighter form",
      items: [
        { slug: "strategy", how: "Start with a function, or a dict of functions. Use classes when a strategy carries state or several methods." },
        { slug: "factory-method", how: "A plain function or a dict lookup often does the job. Use the pattern when subclasses truly decide what to create." },
        { slug: "state", how: "Two or three states with simple rules fit an enum and a `match`. Use State when each state has many behaviours that change together." },
        { slug: "command", how: "A function value is already a command. Use Command objects when you need undo, a queue, or saved history." }
      ]
    }
  ],
  quiz: [
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "Gift wrap costs 30 for small boxes and 50 for large ones. What is the simplest good design?",
      hint: "The two cases differ only by a number.",
      options: [
        "A WrapStrategy interface with SmallWrap and LargeWrap classes",
        "A dict (or Map) from size to price",
        "An abstract factory for wrap families",
        "A State pattern for box sizes"
      ],
      answer: 1,
      explain:
        "The cases differ only in a value, so a table is enough and easy to change. An interface with two classes adds types for two numbers. " +
        "Abstract Factory is for families of related objects, and State is for behaviour that changes as an object moves between states; neither fits."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "Which line is the clearest sign of speculative generality?",
      hint: "Something built for a future that hasn't arrived.",
      code: {
        lang: "python",
        text: [
          "class TaxCalculator:",
          "    def __init__(self, plugins: list[object] | None = None) -> None:",
          "        self.plugins = plugins or []  # never passed by any caller",
          "",
          "    def tax(self, amount: int) -> int:",
          "        return amount * 18 // 100",
          "",
          "print(TaxCalculator().tax(1000))"
        ].join("\n")
      },
      answer: 2,
      explain:
        "Line 2 adds a plugins hook that no caller uses (line 3 even says so). It must be read, documented and kept working for nothing. " +
        "Line 6 is the real rule, and line 8 is just the demo. Remove the parameter; add it back when a real plugin appears."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "Which situation best justifies a full Strategy pattern with classes?",
      hint: "Look for behaviour and state, not just values.",
      options: [
        "Two discount percentages that marketing may change",
        "Payment providers that each need their own API client, retries and settings, added by other teams",
        "A single sorting rule used in one place",
        "A flag that turns logging on or off"
      ],
      answer: 1,
      explain:
        "Providers with their own state, setup and behaviour, added by other teams, are what the pattern was made for. " +
        "Percentages are data (a dict). One rule in one place is a function. An on/off flag is an if."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "What does the rule of three suggest?",
      hint: "When to stop copying and start abstracting.",
      code: {
        lang: "scala",
        text: [
          "def metroFee(total: Int): Int = if total > 499 then 0 else 40",
          "def townFee(total: Int): Int = if total > 699 then 0 else 60",
          "// a third one is about to be written..."
        ].join("\n")
      },
      options: [
        "Abstract as soon as you write the first function",
        "Never abstract; copying is always clearer",
        "Tolerate a second copy, and abstract when the third similar case appears",
        "Use exactly three classes for every pattern"
      ],
      answer: 2,
      explain:
        "By the third case you can see what really varies (here the limit and the fee), so the abstraction fits the facts. " +
        "Abstracting after one case is guessing. Never abstracting leads to scattered copies. The rule is about timing, not class counts."
    },
    {
      type: "order",
      tag: "Put in order",
      prompt: "Order these designs from lightest to heaviest, the way you would grow them as needs appear.",
      hint: "Each step is taken only when a change request asks for it.",
      steps: [
        "A constant or an if",
        "A dict of values",
        "A dict of functions",
        "Strategy classes behind an interface",
        "Strategy classes plus a plugin registry"
      ],
      shuffled: [3, 0, 4, 2, 1],
      explain:
        "Start with the least machinery, then move up one step at a time: values in a table, then behaviour as functions, then classes when strategies need state, then a registry when outsiders must add their own. " +
        "Jumping straight to the last step is pattern overuse; staying at the first step while rules pile up is the opposite smell."
    }
  ]
};

export default guide;
