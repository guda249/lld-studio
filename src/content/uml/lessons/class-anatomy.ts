/**
 * UML Basics, lesson 2: anatomy of a class box. Name, attributes, operations, visibility, static / abstract and
 * stereotypes. Every code file runs as-is.
 *
 * The diagram engine cannot underline or italicise single member lines, so static and abstract members carry the
 * UML property strings {static} and {abstract}; the text explains how they look when drawn by hand.
 */
import type { UmlLesson } from "../../guides/types";
import namePy from "./code/class-anatomy-name.py?raw";
import nameScala from "./code/class-anatomy-name.scala?raw";
import attrPy from "./code/class-anatomy-attributes.py?raw";
import attrScala from "./code/class-anatomy-attributes.scala?raw";
import opsPy from "./code/class-anatomy-operations.py?raw";
import opsScala from "./code/class-anatomy-operations.scala?raw";
import visPy from "./code/class-anatomy-visibility.py?raw";
import visScala from "./code/class-anatomy-visibility.scala?raw";
import staticPy from "./code/class-anatomy-static.py?raw";
import staticScala from "./code/class-anatomy-static.scala?raw";
import stereoPy from "./code/class-anatomy-stereotypes.py?raw";
import stereoScala from "./code/class-anatomy-stereotypes.scala?raw";

const lesson: UmlLesson = {
  id: "class-anatomy",
  order: 2,
  title: "Anatomy of a class box",
  lede:
    "A class box has three compartments: the **name** on top, the **attributes** (data) in the middle and the **operations** (methods) at the bottom. " +
    "A few small marks say who may use each member, which ones belong to the class itself, and what kind of type the box is. " +
    "Learn these and you can read any class diagram line by line.",
  concepts: [
    {
      id: "name",
      name: "Name compartment",
      short: "The top part: the class name",
      notation: "Name",
      visual: {
        kind: "class",
        uml: { classes: [{ name: "ParkingTicket", kind: "concrete" }], relations: [] }
      },
      scene: [
        { say: "Every class box starts with its name, in bold and centred in the top compartment. That is the only part you must draw.", show: ["ParkingTicket"] },
        { say: "Use the exact spelling of the class in the code: a singular noun in PascalCase. Then anyone can search the code for it.", show: [] }
      ],
      what:
        "The top compartment holds the class name, and sometimes a stereotype above it (such as «interface»). " +
        "The lower compartments are optional: early sketches often show names only, and you add members as the design firms up.",
      spot: "The word after `class`, `trait`, `object` or `enum` in the code. One class in the code is one box in the diagram, with the same name.",
      when:
        "Always. In the first minutes of an interview, draw boxes with names only, connect them, and fill in members once the shape of the design is agreed.",
      code: { python: namePy, scala: nameScala },
      hl: { python: [1], scala: [1] }
    },
    {
      id: "attributes",
      name: "Attributes",
      short: "The middle part: data, written name: Type",
      notation: "x: T",
      visual: {
        kind: "class",
        uml: {
          classes: [
            { name: "Ticket", kind: "concrete", members: ["- id: String", "- hours: Integer", "- vehicle: Vehicle", "+ summary(): String"] },
            { name: "Vehicle", kind: "concrete", members: ["- plate: String"] }
          ],
          relations: [{ from: "Ticket", to: "Vehicle", type: "association" }]
        }
      },
      scene: [
        { say: "The middle compartment lists the attributes: the data each object keeps. Each line reads visibility, name, colon, type.", show: ["Ticket"] },
        { say: "When an attribute's type is another class in the diagram, it also gets a line to that class. Both say the same thing: a Ticket keeps a Vehicle.", show: ["Vehicle", "Ticket>Vehicle"] }
      ],
      what:
        "An attribute is a field: `name: Type`, for example `hours: Integer`. UML has its own simple types (`String`, `Integer`, `Boolean`, `Real`), " +
        "and you may also write your language's types (`int`, `str`, `Double`). A default value can follow: `hours: Integer = 1`.",
      spot: "Fields set in `__init__` (`self._hours = hours`) or Scala constructor parameters and `val` / `var` in the class body. The type hint gives the type.",
      when:
        "List the attributes that explain the design: the data a class owns and the links to other classes. Skip trivial ones (timestamps, ids) when the diagram gets crowded.",
      code: { python: attrPy, scala: attrScala },
      hl: { python: [8, 9, 10], scala: [4, 5, 6] }
    },
    {
      id: "operations",
      name: "Operations",
      short: "The bottom part: methods with parameters and return type",
      notation: "f(): T",
      visual: {
        kind: "class",
        uml: {
          classes: [
            { name: "Ticket", kind: "concrete", members: ["- hours: Integer", "+ fee(rate: Real): Real", "+ pay(card: Card): Boolean"] },
            { name: "Card", kind: "concrete", members: ["+ charge(amount: Real): Boolean"] }
          ],
          relations: [{ from: "Ticket", to: "Card", type: "dependency" }]
        }
      },
      scene: [
        { say: "The bottom compartment lists operations. Each one reads name, then parameters in brackets as name: Type, then a colon and the return type.", show: ["Ticket"] },
        { say: "Card appears only as a parameter of pay, so Ticket uses it for a moment: a dashed dependency line, not a solid one.", show: ["Card", "Ticket>Card"] }
      ],
      what:
        "An operation is a method: `name(param: Type, …): ReturnType`. `fee(rate: Real): Real` takes a rate and gives back a number. " +
        "Leave out the return type (or write `: void` / `Unit`) when the method returns nothing.",
      spot: "Every `def` in the class. Python: the type hints and the `->` arrow. Scala: the parameter types and the type after the closing bracket. Skip `self`.",
      when:
        "Show the operations other classes call: the public promises of the class. Constructors, getters and private helpers can usually be left out.",
      code: { python: opsPy, scala: opsScala },
      hl: { python: [11, 14], scala: [7, 8] }
    },
    {
      id: "visibility",
      name: "Visibility",
      short: "Who may use a member: + - # ~",
      notation: "+ - # ~",
      visual: {
        kind: "class",
        uml: {
          classes: [
            { name: "Account", kind: "concrete", members: ["+ owner: String", "- balance: Real", "# limit: Real", "~ audit(): String"] },
            { name: "SavingsAccount", kind: "concrete", members: ["+ allows(amount: Real): Boolean"] }
          ],
          relations: [{ from: "SavingsAccount", to: "Account", type: "inheritance" }]
        }
      },
      scene: [
        { say: "The first character of each member line is its visibility. + is public, - is private, # is protected and ~ is package.", show: ["Account"] },
        { say: "A subclass can use # members but not - members. So SavingsAccount may read limit, while balance stays hidden inside Account.", show: ["SavingsAccount", "SavingsAccount>Account"] }
      ],
      what:
        "`+` public: any class may use it. `-` private: only this class. `#` protected: this class and its subclasses. " +
        "`~` package: classes in the same package (module). Most fields are `-`; most operations that others call are `+`.",
      spot:
        "Scala: no keyword = `+`, `private` = `-`, `protected` = `#`, `private[pkg]` = `~`. Python has no enforcement, only names: " +
        "no underscore = `+`, `__name` = `-`, `_name` = `#` (or `~`; Python can't tell them apart).",
      when:
        "Always mark visibility once you list members: it shows what is the public face of a class and what is free to change. A diagram full of `+` fields is a warning sign.",
      code: { python: visPy, scala: visScala },
      hl: { python: [3, 4, 5, 7], scala: [4, 5, 6, 8] }
    },
    {
      id: "static-abstract",
      name: "Static and abstract",
      short: "Underlined: one per class. Italic: no body",
      notation: "{static}",
      visual: {
        kind: "class",
        uml: {
          classes: [
            { name: "Shape", kind: "abstract", members: ["+ area(): Real {abstract}", "+ describe(): String"] },
            { name: "Circle", kind: "concrete", members: ["+ count: Integer {static}", "- radius: Real", "+ area(): Real"] }
          ],
          relations: [{ from: "Circle", to: "Shape", type: "inheritance" }]
        }
      },
      scene: [
        { say: "Shape is abstract: its name is in italics and you can't create a Shape on its own. area has no body here, so it is abstract too.", show: ["Shape"] },
        { say: "Circle fills in area. Its count belongs to the class, not to each circle, so it is static: one shared value however many circles exist.", show: ["Circle", "Circle>Shape"] },
        { say: "By hand, static members are underlined and abstract ones are written in italics. Tools also write {static} and {abstract}, as here.", show: [] }
      ],
      what:
        "**Static** (underlined, or `{static}`): the member belongs to the class itself, shared by all objects; call it as `Circle.count`. " +
        "**Abstract** (italics, or `{abstract}`): an operation with no body that subclasses must fill in. A class with one is abstract, and its name is in italics too.",
      spot:
        "Static: a Python class variable or `@staticmethod` / `@classmethod`; a Scala companion `object`. " +
        "Abstract: Python `@abstractmethod` in an `ABC`; Scala `abstract class` or a `def` without `=`.",
      when:
        "Mark static members so readers know the value is shared (counters, factories, constants). Mark abstract operations so they see which methods every subclass must write.",
      code: { python: staticPy, scala: staticScala },
      hl: { python: [5, 7, 14], scala: [1, 2, 10] }
    },
    {
      id: "stereotypes",
      name: "Stereotypes",
      short: "«interface», «abstract», «enumeration»",
      notation: "«»",
      visual: {
        kind: "class",
        uml: {
          classes: [
            { name: "PaymentMethod", kind: "interface", members: ["+ pay(amount: Real): String"] },
            { name: "BasePayment", kind: "abstract", members: ["+ pay(amount: Real): String", "# label(): String {abstract}"] },
            { name: "Card", kind: "concrete", members: ["- kind: CardType", "# label(): String"] },
            { name: "CardType", kind: "enum", members: ["VISA", "RUPAY"] }
          ],
          relations: [
            { from: "BasePayment", to: "PaymentMethod", type: "realization" },
            { from: "Card", to: "BasePayment", type: "inheritance" },
            { from: "Card", to: "CardType", type: "association" }
          ]
        }
      },
      scene: [
        { say: "Text in «guillemets» above the name is a stereotype: it says what kind of type the box is. «interface» means promises only, no code.", show: ["PaymentMethod"] },
        { say: "«abstract» shares code but can't be created on its own. It keeps the interface's promise, so a dashed line with a hollow triangle points up.", show: ["BasePayment", "BasePayment>PaymentMethod"] },
        { say: "Card is a normal class with no stereotype. Its kind comes from an «enumeration»: a fixed list of values, written in the attribute compartment.", show: ["Card", "Card>BasePayment", "CardType", "Card>CardType"] }
      ],
      what:
        "A stereotype is a label in `«…»` that gives a box a special meaning. The common ones: **«interface»** (only operation signatures), " +
        "**«abstract»** (partly written, can't be created), **«enumeration»** (a fixed set of named values). Plain classes have none.",
      spot:
        "«interface»: a Scala `trait` with no code, or a Python `ABC` / `Protocol` with only abstract methods. «abstract»: `abstract class` or an `ABC` with some code. " +
        "«enumeration»: Scala `enum`, Python `Enum`.",
      when:
        "Use them whenever a box is not a plain class. Patterns depend on it: Strategy, Observer and Factory Method all start from an «interface» or «abstract» type.",
      code: { python: stereoPy, scala: stereoScala },
      hl: { python: [5, 10, 18], scala: [1, 4, 8] }
    }
  ],
  practiceTitle: "Read the class box",
  practice: [
    {
      type: "mcq",
      tag: "Concept",
      prompt: "A class box has three compartments. What goes in each, from top to bottom?",
      options: ["Name, attributes, operations", "Name, operations, attributes", "Attributes, name, operations", "Stereotype, name, relationships"],
      answer: 0,
      hint: "Data comes before behaviour.",
      explain:
        "Top: the **name** (with an optional stereotype above it). Middle: **attributes** (fields). Bottom: **operations** (methods). " +
        "Relationships are lines between boxes, never inside them, and swapping attributes and operations would confuse every reader."
    },
    {
      type: "mcq",
      tag: "Read the diagram",
      prompt: "What does the line `# limit: Real` tell you?",
      options: [
        "A public method called limit that returns a Real",
        "A protected field called limit, holding a number; subclasses may use it",
        "A private field that only this class may use",
        "A static field shared by all objects"
      ],
      answer: 1,
      hint: "Look at the first character, then at the brackets (there are none).",
      explain:
        "`#` means **protected** (this class and its subclasses), and there are no brackets, so it is an **attribute** of type Real. " +
        "Public would be `+`, private `-`, and static would be underlined or marked `{static}`."
    },
    {
      type: "mcq",
      tag: "Read the code",
      prompt: "Which UML line matches this method?",
      code: { lang: "python", text: "class Cart:\n    def add(self, item: str, qty: int) -> bool:\n        return qty > 0\n\nprint(Cart().add(\"tea\", 2))" },
      options: ["+ add(self, item, qty)", "+ add(item: String, qty: Integer): Boolean", "- add: Boolean", "+ add(): item, qty"],
      answer: 1,
      hint: "Parameters go in brackets as name: Type; the return type comes after a colon.",
      explain:
        "`+ add(item: String, qty: Integer): Boolean`: public (no underscore), both parameters with types, and the return type after the colon. " +
        "`self` is never drawn; `- add: Boolean` is a private attribute, not an operation; and the last option puts parameters where the return type goes."
    },
    {
      type: "mcq",
      tag: "Read the code",
      prompt: "How do you draw `count` from this Scala code?",
      code: { lang: "scala", text: "class Order(val id: String):\n  Order.count += 1\n\nobject Order:\n  var count: Int = 0\n\n@main def demo(): Unit =\n  Order(\"A\"); Order(\"B\")\n  println(Order.count)" },
      options: ["+ count: Integer, underlined (static)", "- count: Integer, in italics (abstract)", "As a separate class box called Order with a dependency line"],
      answer: 0,
      hint: "Where does `count` live: in each order, or in the companion object?",
      explain:
        "`count` lives in the companion `object`, so there is one value for the whole class: a **static** member, drawn underlined (or `{static}`) in the Order box. " +
        "Italics mean abstract (no body), which is wrong here, and a companion object is not drawn as a second class."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "Which stereotype fits a Scala `enum Size: case Small, Medium, Large`?",
      options: ["«interface»", "«abstract»", "«enumeration»", "«utility»"],
      answer: 2,
      hint: "A fixed list of named values.",
      explain:
        "An `enum` is a fixed set of values, so it is an **«enumeration»**, with the values listed in its attribute compartment. " +
        "«interface» is promises only, «abstract» is a partly written class, and «utility» is for a box of static helpers."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "The diagram says `- balance: Real` (private). Which line breaks that rule?",
      code: {
        lang: "scala",
        text:
          "class Wallet(private var balance: Double):\n  def add(amount: Double): Unit = balance += amount\n  def total: Double = balance\n\nclass Spender(wallet: Wallet):\n  def spend(): Unit = wallet.balance -= 10\n\n@main def demo(): Unit = println(Wallet(50).total)"
      },
      answer: 6,
      hint: "Private means only the class itself may touch it.",
      explain:
        "Line 6 reaches into another class's private field (`wallet.balance`), which the `-` forbids; Scala won't even compile it. " +
        "Lines 2 and 3 are inside Wallet, so they may use `balance`; Spender should call a public operation instead."
    },
    {
      type: "order",
      tag: "Put in order",
      prompt: "Put the parts of one operation line in the order UML writes them:",
      steps: ["Visibility (+)", "Name (fee)", "Parameters in brackets (rate: Real)", "Colon and return type (: Real)"],
      shuffled: [2, 3, 0, 1],
      hint: "It reads like a function signature with a symbol in front.",
      explain:
        "`+ fee(rate: Real): Real`: **visibility**, **name**, **parameters** and then the **return type**. " +
        "Putting the return type first is the Java / C style, not UML; UML always writes types after a colon."
    }
  ]
};

export default lesson;
