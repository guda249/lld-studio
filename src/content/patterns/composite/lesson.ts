import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-bundle.py?raw";
import ex1Scala from "./code/ex1-bundle.scala?raw";
import ex2Py from "./code/ex2-org.py?raw";
import ex2Scala from "./code/ex2-org.scala?raw";
import ex3Py from "./code/ex3-formula.py?raw";
import ex3Scala from "./code/ex3-formula.scala?raw";
import ex4Py from "./code/ex4-course.py?raw";
import ex4Scala from "./code/ex4-course.scala?raw";

const lesson: PatternLesson = {
  slug: "composite",
  analogy:
    "An org chart. Ask a department for its total salary cost: it asks each team, each team asks each employee, and the answers add up. You ask the department exactly the way you would ask one person.",
  problem: {
    text: "Files and folders have no common interface, so every function that walks the tree must check types and recurse by hand: if it is a File do this, if it is a Folder loop over its children. The same checks are copied into total_size, count_files and every other function, and adding a new item type such as Shortcut means editing all of them.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Give leaves (File) and containers (Folder) one common interface (Node, with size() and render()). A leaf does the real work. A container implements the same method by asking each child and combining the answers. Client code calls node.size() on anything, and the recursion is handled by the structure itself.",
  participants: [
    { role: "Component", name: "Node", kind: "abstract", description: "The common interface for leaves and containers: size() and render()." },
    { role: "Leaf", name: "File", kind: "concrete", description: "Has no children and does the real work." },
    { role: "Composite", name: "Folder", kind: "concrete", description: "Stores child Nodes and implements each operation by delegating to them and combining the results." },
    { role: "Client", name: "Demo code", kind: "client", description: "Calls size() or render() without knowing whether it holds a file or a whole folder." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "In Scala, an immutable tree of a sealed trait plus case classes is the natural composite, and new operations are recursive functions that use match. Python's frozen dataclasses with a children tuple and match/case work the same way. The trade-off: adding a new operation is easy (one more function), but adding a new node type means updating every match. The classic class version is the reverse.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "The browser DOM and UI widget trees: a panel contains buttons and other panels.",
    "Abstract syntax trees in compilers, linters and formula engines.",
    "File systems, menus with sub-menus and org charts.",
    "Bills of materials in manufacturing and product bundles in online shops.",
  ],
  whenToUse: [
    "Your data is naturally a part-whole tree.",
    "Clients should not care whether they hold one item or a group of items.",
  ],
  whenNotToUse: [
    "The structure is not a tree: graphs with shared nodes or cycles need extra care to avoid counting twice or looping forever.",
    "Leaves and containers share almost no behaviour; a forced common interface leads to meaningless methods such as File.add().",
  ],
  pros: [
    "Simple client code; the recursion lives in the structure.",
    "New node types plug in without changing clients (Open/Closed).",
  ],
  cons: [
    "The common interface can become too general.",
    "Type safety versus uniformity: if add() is on the component, leaves must reject it at runtime; if it is only on the composite, clients sometimes need to check types.",
  ],
  confusedWith: [
    { name: "Decorator", difference: "Also recursive, but a decorator wraps exactly one child and adds behaviour; a composite has many children and combines their results." },
    { name: "Iterator", difference: "Often used with Composite to walk the tree in order, as in the course example." },
    { name: "Visitor", difference: "Often used with Composite to add new operations to the tree without editing every node class." },
  ],
  solid:
    "Open/Closed (new node types without changing clients), Liskov Substitution (any Node works wherever a Node is expected) and Single Responsibility (each node handles only its own part of the work).",
  interviewUses: [
    "File system design.",
    "Organisation hierarchy and cost roll-ups.",
    "Menu systems with nested sub-menus.",
    "Expression evaluators such as Add(Num(2), Mul(Num(3), Num(4))), and product bundles in e-commerce.",
  ],
  examples: [
    {
      id: "bundle",
      domain: "E-commerce",
      title: "Gift bundles in a cart",
      situation:
        "An online shop sells single items and festive bundles. A bundle can contain other bundles and has its own discount, and the cart must show one total whatever the mix.",
      roles: [
        { role: "Component", name: "CartItem" },
        { role: "Leaf", name: "Item" },
        { role: "Composite", name: "Bundle" },
        { role: "Client", name: "Cart total loop" },
      ],
      why: "The cart asks every entry for price() and adds them up. A bundle answers by asking its children and then applying its own discount, so nesting works at any depth.",
      goodToKnow:
        "A composite does not have to just add things up: it can apply its own rule, such as a discount, on top of its children's results. Decide carefully whether nested discounts should stack, as they do here.",
      walkthrough: [
        "The cart holds a phone cover and a Diwali gift box.",
        "The gift box contains sweets, a diya set and a nested dry fruit pack.",
        "The dry fruit pack totals ₹1,000 and applies 5% off, giving ₹950.",
        "The gift box adds ₹650, ₹300 and ₹950, then applies 10% off, giving ₹1,710.",
        "The cart adds the ₹299 cover for a total of ₹2,009, without knowing which entries were bundles.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "org",
      domain: "HR",
      title: "Team cost roll-up",
      situation:
        "Finance asks for the yearly cost and headcount of one person, one team or the whole engineering department. The reporting code should not need a separate path for each level.",
      roles: [
        { role: "Component", name: "OrgUnit" },
        { role: "Leaf", name: "Employee" },
        { role: "Composite", name: "Department" },
        { role: "Client", name: "budget_line" },
      ],
      why: "Departments contain people and other departments. Each Department sums cost() and headcount() over its members, so budget_line works the same for a single employee and for the whole tree.",
      goodToKnow:
        "In a big org these totals are recalculated on every call. If that becomes slow, cache the totals in each department and clear the cache when members change.",
      walkthrough: [
        "Sana is a single Employee; her line shows 1 person and ₹14 lakh.",
        "The Payments team adds up Divya, Karan and Sana: 3 people and ₹73 lakh.",
        "Engineering contains the CTO, the Payments team and the Mobile team.",
        "It asks each member, and the teams ask their own members in turn.",
        "The total is 5 people and ₹155 lakh, printed by the same budget_line function.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "formula",
      domain: "Spreadsheets",
      title: "Invoice formula tree",
      situation:
        "A small billing spreadsheet needs formulas like SUM(B2 * C2, B3 * C3) * (1 + D1). Each formula is built from numbers, cell references and operators that can nest without limit.",
      roles: [
        { role: "Component", name: "Expr" },
        { role: "Leaf", name: "Num, Ref" },
        { role: "Composite", name: "Add, Mul, Sum" },
        { role: "Client", name: "Demo code" },
      ],
      why: "An expression tree is a composite: numbers and cell references are leaves, and operators are composites that evaluate their children and combine the results. evaluate() and show() both just recurse.",
      goodToKnow:
        "Composites can have a fixed number of children (Add and Mul have two) or any number (Sum). Spreadsheets also need cycle checks, because a cell that refers to itself would recurse forever.",
      walkthrough: [
        "The formula tree is built from Mul, Sum, Add, Ref and Num nodes.",
        "show() walks the tree and prints the formula back as text.",
        "evaluate() computes 2 × ₹450 plus 1 × ₹1,200, which is ₹2,100, then multiplies by 1.18 for GST: ₹2,478.",
        "A single Ref leaf can be evaluated on its own, just like the whole tree.",
        "With B2 changed to 3, the same tree gives ₹3,009.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "course",
      domain: "Education",
      title: "Course progress",
      situation:
        "A learning app shows progress for a whole course, a section or a single lesson, and a button that jumps to the next unfinished lesson. Sections can contain lessons or more sections.",
      roles: [
        { role: "Component", name: "CourseNode" },
        { role: "Leaf", name: "Lesson" },
        { role: "Composite", name: "Section" },
        { role: "Client", name: "progress" },
      ],
      why: "Every node can report its minutes and list its lessons. A section answers by asking its children, so progress() works at every level. Combining this with an iterator (lessons()) gives a simple way to walk the leaves in order.",
      goodToKnow:
        "Because lessons() is lazy (a generator in Python, an Iterator in Scala), finding the next unfinished lesson stops as soon as it finds one instead of walking the whole course.",
      walkthrough: [
        "The course has a Basics section and a Patterns section with two sub-sections.",
        "progress(course) collects all six lessons; three are done, covering 55 of 130 minutes, which is 42%.",
        "progress(patterns) does the same for just that section: 1 of 4 lessons and 21%.",
        "A single Lesson also works with progress(), giving 0 of 1.",
        "Walking lessons() in order, the first unfinished lesson is Builder.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
