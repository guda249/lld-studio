import type { Guide } from "../guides/types";
import accountPy from "./code/oop-basics-account.py?raw";
import accountScala from "./code/oop-basics-account.scala?raw";
import shapesPy from "./code/oop-basics-shapes.py?raw";
import shapesScala from "./code/oop-basics-shapes.scala?raw";
import carBeforePy from "./code/oop-basics-car-before.py?raw";
import carBeforeScala from "./code/oop-basics-car-before.scala?raw";
import carAfterPy from "./code/oop-basics-car-after.py?raw";
import carAfterScala from "./code/oop-basics-car-after.scala?raw";

const guide: Guide = {
  section: "solid",
  id: "oop-basics",
  order: 1,
  title: "OOP in one page",
  short: "Classes and objects, encapsulation, inheritance vs composition, polymorphism, interfaces and traits.",
  lede:
    "The five SOLID principles and every design pattern are built from a handful of object-oriented ideas. " +
    "This page gives you just enough of each, with small runnable examples, so the rest of the primer makes sense.",
  blocks: [
    {
      type: "text",
      text:
        "Object-oriented programming (OOP) groups data and the code that works on that data into one unit, the **class**. " +
        "You then build **objects** from the class and let them talk to each other by calling methods. " +
        "Five words carry most of the weight: class, object, encapsulation, inheritance and polymorphism. " +
        "Add **interface** (a list of methods with no code, called a `trait` in Scala) and **composition** (one object holding another), and you have the whole toolkit."
    },
    {
      type: "code",
      title: "Classes, objects and encapsulation",
      code: { python: accountPy, scala: accountScala },
      note:
        "One class, two objects: Asha's and Ravi's accounts each keep their own balance. The balance is private, so the only way to change it is through `deposit` and `withdraw`, which check the rules."
    },
    {
      type: "list",
      title: "What the example shows",
      style: "plain",
      items: [
        "**Class**: the blueprint (`BankAccount`). It says what data each object has and what it can do.",
        "**Object** (or instance): one thing built from the class (`asha`, `ravi`). Each has its own copy of the data.",
        "**Encapsulation**: the object hides its data (`_balance` / `private var`) and offers methods instead. Callers can't break the rule \"no negative balance\", because they can't touch the number directly.",
        "**Method**: a function that belongs to a class and works on that object's data (`deposit`, `withdraw`)."
      ]
    },
    {
      type: "callout",
      tone: "tip",
      title: "Private in Python vs Scala",
      text:
        "Scala enforces `private`: other code will not compile if it touches the field. Python has no real private; a leading underscore (`_balance`) is a promise between programmers that says \"don't touch\". Linters and reviewers enforce it."
    },
    {
      type: "diagram",
      title: "Interfaces, inheritance and polymorphism in one picture",
      uml: {
        classes: [
          { name: "Shape", kind: "interface", members: ["+ area(): float", "+ name(): str"] },
          { name: "Circle", kind: "concrete", members: ["- radius", "+ area()", "+ name()"] },
          { name: "Rectangle", kind: "concrete", members: ["- width", "- height", "+ area()", "+ name()"] },
          { name: "Square", kind: "concrete", members: ["+ name()"] }
        ],
        relations: [
          { from: "Circle", to: "Shape", type: "realization" },
          { from: "Rectangle", to: "Shape", type: "realization" },
          { from: "Square", to: "Rectangle", type: "inheritance" }
        ]
      }
    },
    {
      type: "code",
      title: "Interfaces / traits, inheritance and polymorphism",
      code: { python: shapesPy, scala: shapesScala },
      note:
        "`report` only knows about `Shape`. It calls `area()` and the object itself decides which code runs. That is polymorphism, and it is the engine behind almost every pattern."
    },
    {
      type: "list",
      title: "The words, one line each",
      style: "plain",
      items: [
        "**Interface** (Python: an `ABC` with only `@abstractmethod`s, or a `Protocol`; Scala: a `trait`): a promise of methods, with no code. A class that keeps the promise **implements** (or **realizes**) it. In UML: dashed line, hollow triangle.",
        "**Abstract class**: like an interface, but it may also hold fields and some finished methods. You can't build an object from it directly.",
        "**Inheritance** (`class Square(Rectangle)` / `extends Rectangle`): the child gets all of the parent's code and may **override** some of it. It says \"is a\". In UML: solid line, hollow triangle.",
        "**Polymorphism** (\"many shapes\"): one call such as `s.area()` runs different code depending on the real object behind `s`.",
        "**Composition**: one object holds another in a field and calls it to do part of the job. It says \"has a\"."
      ]
    },
    {
      type: "compare",
      before: {
        title: "Inheritance used to borrow code",
        text:
          "`Car` extends `Engine` only to get `start()`. Now every car **is** an engine: `running` and `start()` are part of the car's public face, and any function that wants an `Engine` will take a `Car`. When the team asks for an electric car, there is no clean way to give it a motor instead.",
        code: { python: carBeforePy, scala: carBeforeScala },
        uml: {
          classes: [
            { name: "Engine", kind: "concrete", members: ["+ running: bool", "+ start()"] },
            { name: "Car", kind: "concrete", members: ["+ drive()"] }
          ],
          relations: [{ from: "Car", to: "Engine", type: "inheritance" }]
        }
      },
      after: {
        title: "Composition: the car has an engine",
        text:
          "`Car` keeps an `Engine` in a private field and **delegates** (hands the work over) to it. The car's public face is just `drive()`. Swapping the engine later touches one line inside `Car`, and nothing outside it notices.",
        code: { python: carAfterPy, scala: carAfterScala },
        uml: {
          classes: [
            { name: "Car", kind: "concrete", members: ["- engine: Engine", "+ drive()"] },
            { name: "Engine", kind: "concrete", members: ["+ running: bool", "+ start()"] }
          ],
          relations: [{ from: "Car", to: "Engine", type: "composition" }]
        }
      }
    },
    {
      type: "callout",
      tone: "tip",
      title: "The is-a test",
      text:
        "Before you write `extends`, say the sentence out loud: \"a Square **is a** Rectangle\" sounds right; \"a Car **is an** Engine\" does not. If the sentence sounds wrong, use a field instead. Lesson 7 (composition over inheritance) goes deeper, and lesson 4 (Liskov) shows that even \"sounds right\" is not always enough."
    },
    {
      type: "list",
      title: "How the rest of this primer uses these ideas",
      style: "ticks",
      items: [
        "**SRP** and **ISP** are about drawing class and interface boundaries in the right place.",
        "**OCP** and **DIP** lean on interfaces and polymorphism: code talks to `Shape`, not to `Circle`.",
        "**LSP** sets the rules a child class must follow so inheritance stays safe.",
        "**Composition over inheritance** is the habit that makes the other four easier."
      ]
    },
    {
      type: "patterns",
      title: "Patterns that are mostly these basics",
      items: [
        { slug: "strategy", how: "An interface plus polymorphism: the caller holds a `Strategy` and never asks which one it is." },
        { slug: "template-method", how: "Inheritance done on purpose: the parent fixes the steps, children override one or two." },
        { slug: "decorator", how: "Composition: a wrapper holds an object of the same interface and adds a little on top." }
      ]
    }
  ],
  quiz: [
    {
      type: "mcq",
      tag: "Concept",
      prompt: "What is the difference between a class and an object?",
      options: [
        "A class is the blueprint; an object is one thing built from it, with its own data",
        "A class holds data; an object holds methods",
        "They are two names for the same thing",
        "An object is a class that has no methods"
      ],
      answer: 0,
      hint: "Think of BankAccount versus asha and ravi.",
      explain:
        "BankAccount is written once; asha and ravi are two objects built from it, each with its own balance. Classes describe both data and methods, so the second option is wrong, and the two words are not interchangeable."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "Which line breaks encapsulation?",
      code: {
        lang: "python",
        text:
          "class Wallet:\n    def __init__(self) -> None:\n        self._cash = 0\n\n    def add(self, amount: int) -> None:\n        if amount > 0:\n            self._cash += amount\n\n\nw = Wallet()\nw.add(100)\nw._cash = -500\nprint(w._cash)"
      },
      answer: 12,
      hint: "Which line skips the method that checks the rule?",
      explain:
        "Line 12 writes _cash directly from outside the class, skipping the check in add(), so the wallet ends up negative. The other lines either belong to the class or use its public method. In Scala, private var cash would make that line fail to compile."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "report(shapes) calls s.area() on every item and gets the right answer for circles and squares alike. What is this called?",
      options: ["Polymorphism", "Encapsulation", "Composition", "Overloading"],
      answer: 0,
      hint: "One call, many kinds of object, each running its own code.",
      explain:
        "Polymorphism means the same call runs different code depending on the real object. Encapsulation is about hiding data, composition is one object holding another, and overloading is several methods with the same name but different parameters in one class."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "A Report class needs to send e-mails. Which design fits the is-a test?",
      options: [
        "Report keeps an EmailSender in a field and calls it",
        "Report extends EmailSender",
        "EmailSender extends Report",
        "Copy the e-mail code into Report"
      ],
      answer: 0,
      hint: "Say \"a Report is an EmailSender\" out loud.",
      explain:
        "A report is not an e-mail sender, so inheritance (either way round) is wrong; it would also expose sending methods on every report. Copying code duplicates it. Holding a sender in a field (composition) gives the report the ability without pretending to be something it is not."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "In Scala, what is the closest match to a Python ABC whose methods are all @abstractmethod?",
      options: ["A trait with only abstract defs", "A case class", "An object", "A final class"],
      answer: 0,
      hint: "It lists methods but gives no code for them.",
      explain:
        "A trait with only abstract methods is an interface, just like a fully abstract ABC. A case class is a concrete data class, an object is a single instance, and a final class can't be extended at all."
    }
  ]
};

export default guide;
