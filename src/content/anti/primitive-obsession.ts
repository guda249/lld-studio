import type { Guide } from "../guides/types";
import beforePy from "./code/primitive-obsession-before.py?raw";
import beforeScala from "./code/primitive-obsession-before.scala?raw";
import afterPy from "./code/primitive-obsession-after.py?raw";
import afterScala from "./code/primitive-obsession-after.scala?raw";

const guide: Guide = {
  section: "anti",
  id: "primitive-obsession",
  order: 6,
  title: "Primitive obsession",
  short: "Strings and numbers for money, ids and states, and the value objects and enums that fix it.",
  lede:
    "**Primitive obsession** is using the language's basic types (`str`, `int`, `float`, `String`, `Double`) for " +
    "ideas that have their own rules: money, ids, email addresses, order states. The code compiles, the types look " +
    "fine, and the bugs hide in values that are the right type but the wrong thing.",
  blocks: [
    {
      type: "text",
      text:
        "The idea in plain words: to the computer, an order id and a customer id are both just text, and 0.1 rupees is " +
        "just a floating-point number (a binary fraction that can't hold 0.1 exactly). So nothing stops you passing " +
        "them in the wrong order, adding rupees to dollars, or writing `\"Delivered\"` where the code expects `\"delivered\"`. " +
        "A **value object** is a tiny, immutable type for one such idea (`Money`, `OrderId`) that checks its own rules. " +
        "An **enum** is a type with a fixed list of allowed values (`OrderStatus.DELIVERED`)."
    },
    {
      type: "list",
      title: "What it looks like",
      style: "crosses",
      items: [
        "Functions with several parameters of the same type: `refund(order_id: str, customer_id: str, …)`.",
        "Money held in `float` / `Double`, often with a separate `currency: str` next to it.",
        "States as strings compared all over the code: `if status == \"delivered\"`.",
        "The same validation copied in many places: \"is this a valid pincode / email / phone?\"",
        "Magic numbers whose meaning lives only in a comment: `role == 3  # admin`.",
        "Tuples or dicts used as objects: `(\"INR\", 499.0)`, `order[\"amt\"]`."
      ]
    },
    {
      type: "callout",
      tone: "warn",
      title: "The change request that exposes it",
      text:
        "\"We now sell in USD as well as INR.\" Every function that adds or compares amounts must now also check the " +
        "currency string, and each one that forgets silently adds dollars to rupees. Finding them means searching " +
        "for every `float` in the code base and guessing which ones are money."
    },
    {
      type: "compare",
      before: {
        title: "Before: everything is a str or a float",
        text:
          "Three bugs run without a single error: the total is 0.30000000000000004, `\"Delivered\"` with a capital D wrongly " +
          "refuses a refund, and the swapped ids pay the wrong person.",
        code: { python: beforePy, scala: beforeScala }
      },
      after: {
        title: "After: Money, ids and an enum",
        text:
          "`Money` uses exact decimals and refuses to mix currencies. `OrderStatus` lists the only allowed states, so a typo " +
          "can't sneak in. Separate id types mean swapped arguments fail: at compile time in Scala (opaque types), and in your " +
          "type checker (such as mypy) in Python.",
        code: { python: afterPy, scala: afterScala }
      }
    },
    {
      type: "list",
      title: "How to spot it in code",
      style: "plain",
      items: [
        "**Scan signatures** for runs of the same primitive type: `(str, str, str)`, `(Int, Int, Int)`. Swapping two of them is one typo away.",
        "**Look for money in floats.** A `float` / `Double` named price, amount, total or fee is a bug waiting to happen.",
        "**Search for string comparisons** against fixed words (`== \"active\"`, `== \"shipped\"`). Each set of words is an enum waiting to be named.",
        "**Look for repeated checks.** The same regex or range check in three places wants one type that checks itself once, when it is created.",
        "**Look for parallel parameters** that always travel together (`amount` + `currency`, `lat` + `lng`): they are one value."
      ]
    },
    {
      type: "callout",
      tone: "tip",
      title: "When primitives are fine",
      text:
        "Inside a small function, local loop counters, and values with no rules of their own (a display label, a free-text " +
        "comment). At the edges of the system (JSON, database rows, command-line arguments) values arrive as primitives; " +
        "convert them to value types as soon as they come in, and back only when they leave. Don't wrap everything: a `Name` " +
        "type with no rules and one use adds noise. Wrap when there is a rule to check or a mix-up to prevent."
    },
    {
      type: "list",
      title: "Principles that fix it",
      style: "ticks",
      items: [
        "**Make illegal states unrepresentable:** if a value can't be built wrong, nobody has to check it later.",
        "**Parse, don't validate:** turn raw input into a checked type once, at the edge; the rest of the code trusts the type.",
        "**Value objects are immutable** and compared by value: two `Money(10, INR)` are equal, and nobody can change one behind your back.",
        "**Use the type system:** Python `Enum`, frozen `dataclass` and `NewType`; Scala `enum`, `case class` and `opaque type`."
      ]
    },
    {
      type: "patterns",
      title: "Patterns that build on value types",
      items: [
        { slug: "state", how: "An enum is the first step. When each status starts to carry its own behaviour (what may happen next, what a refund does), grow it into the State pattern." },
        { slug: "flyweight", how: "Value objects are immutable, so they can be shared safely: one `Currency.INR` or one cached `Money` zero used everywhere." },
        { slug: "builder", how: "When a value needs several checked parts (an address with pincode, city and state), a builder or a smart constructor assembles and checks it in one place." },
        { slug: "strategy", how: "Behaviour keyed by a magic string (`if mode == \"express\"`) becomes an enum first, then a strategy chosen by that enum when the rules grow." }
      ]
    }
  ],
  quiz: [
    {
      type: "mcq",
      tag: "Concept",
      prompt: "Why should money not be stored as a float or Double?",
      hint: "Try 0.1 + 0.2.",
      options: [
        "Floats use too much memory",
        "Binary floating point can't hold most decimal fractions exactly, so sums drift (0.30000000000000004)",
        "Floats can't be negative",
        "Python and Scala don't allow floats in function signatures"
      ],
      answer: 1,
      explain:
        "Floats store binary fractions, so 0.1 is already slightly off, and errors pile up across sums and roundings. Use Decimal / BigDecimal (or whole paise as Int) inside a Money type. " +
        "Memory isn't the issue, floats can be negative, and both languages allow them anywhere."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "This call runs without errors but pays the wrong person. Which line has the bug?",
      hint: "Check the order of the two ids against the signature.",
      code: {
        lang: "python",
        text: [
          "def refund(order_id: str, customer_id: str, amount: float) -> str:",
          "    return f\"refund {amount} to {customer_id} for {order_id}\"",
          "",
          "order, customer = \"O-1001\", \"C-77\"",
          "print(refund(customer, order, 250.0))"
        ].join("\n")
      },
      answer: 5,
      explain:
        "Line 5 passes the customer id where the order id goes. Both are str, so nothing complains. With OrderId and CustomerId types, a type checker (or the Scala compiler) would reject the call. " +
        "Lines 1–2 are correct for the signature, and line 4 assigns the right values."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "Order status is a string compared in 14 places. What is the best first fix?",
      hint: "A fixed list of allowed values.",
      code: {
        lang: "scala",
        text: [
          "if order.status == \"shipped\" then notify(order)",
          "if order.status == \"Shipped\" then track(order) // another file"
        ].join("\n")
      },
      options: [
        "Add .toLowerCase to every comparison",
        "Create an OrderStatus enum and use it for the field and every comparison",
        "Move the strings into constants in a Utils class",
        "Build the full State pattern with a class per status straight away"
      ],
      answer: 1,
      explain:
        "An enum makes the allowed values a type, so typos and casing mistakes no longer compile. Lowercasing hides the symptom in 14 places. String constants still allow any other string. " +
        "The State pattern is the next step only if each status grows real behaviour; starting there is over-building."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "Where should raw strings from a JSON request be turned into value types like Money and OrderId?",
      hint: "Parse, don't validate.",
      options: [
        "As soon as they enter the system, at the edge",
        "Just before saving to the database",
        "Inside every function that uses them",
        "Never; keep JSON values as they are"
      ],
      answer: 0,
      explain:
        "Convert once at the edge, so every function inside can trust its parameter types and none has to re-check. " +
        "Converting just before saving leaves the whole program working with raw values. Checking in every function repeats the work, and never converting keeps all the bugs."
    },
    {
      type: "order",
      tag: "Put in order",
      prompt: "Order the steps to replace float amounts with a Money value object.",
      hint: "Build the type, use it at the edges, then let it spread inward.",
      steps: [
        "Create an immutable Money type with an exact amount and a currency",
        "Give Money its rules: add only the same currency, no rounding surprises",
        "Convert raw amounts to Money where they enter the system",
        "Change function signatures from float to Money, one area at a time",
        "Delete the separate currency parameters that Money now carries"
      ],
      shuffled: [4, 2, 0, 3, 1],
      explain:
        "The type and its rules come first. Then the edges produce Money, so the inside can switch over area by area. " +
        "The loose currency parameters go last, once every caller passes Money; removing them earlier would leave amounts with no currency at all."
    }
  ]
};

export default guide;
