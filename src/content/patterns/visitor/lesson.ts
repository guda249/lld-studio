import type { PatternLesson } from "../../types";
import problemPy from "./code/problem.py?raw";
import problemScala from "./code/problem.scala?raw";
import mainPy from "./code/main.py?raw";
import mainScala from "./code/main.scala?raw";
import idiomaticPy from "./code/idiomatic.py?raw";
import idiomaticScala from "./code/idiomatic.scala?raw";
import ex1Py from "./code/ex1-expr.py?raw";
import ex1Scala from "./code/ex1-expr.scala?raw";
import ex2Py from "./code/ex2-export.py?raw";
import ex2Scala from "./code/ex2-export.scala?raw";
import ex3Py from "./code/ex3-claims.py?raw";
import ex3Scala from "./code/ex3-claims.scala?raw";
import ex4Py from "./code/ex4-devices.py?raw";
import ex4Scala from "./code/ex4-devices.scala?raw";

const lesson: PatternLesson = {
  slug: "visitor",
  analogy:
    "A tax auditor visits a bookshop, an electronics store and a grocery. Each business lets the auditor in, and the auditor applies the rule for that kind of business. Next month a safety inspector visits the same shops with different rules, and the shops did not have to change at all.",
  problem: {
    text: "Cart items (Book, Electronics, Grocery) need tax, then shipping cost, then loyalty points, then a CSV export. Adding each operation as a method on every item class fills them with unrelated jobs, and every new operation means editing classes that were otherwise stable.",
    code: { python: problemPy, scala: problemScala },
  },
  solution:
    "Each item gets one method, accept(visitor), which calls the visitor method for its own type, such as visitor.visit_book(self). This is double dispatch: the code that runs depends on both the item type and the visitor type. Every new operation becomes a new visitor class, and the item classes stay untouched.",
  participants: [
    { role: "Visitor", name: "ItemVisitor", kind: "interface", description: "Declares one visit method per element type: visit_book, visit_electronics, visit_grocery." },
    { role: "Concrete visitor", name: "TaxVisitor, ShippingVisitor", kind: "concrete", description: "Each one is a single operation, with the rule for every element type kept together in one class." },
    { role: "Element", name: "Item", kind: "interface", description: "Declares accept(visitor). In Scala it is a sealed trait." },
    { role: "Concrete element", name: "Book, Electronics, Grocery", kind: "concrete", description: "Implement accept by calling the visit method that matches their own type." },
    { role: "Client", name: "Demo code", kind: "client", description: "Walks the cart and passes a visitor to each item's accept()." },
  ],
  code: { python: mainPy, scala: mainScala },
  idiomatic: {
    note: "Both languages can choose code by type without accept methods. In Python, functools.singledispatch picks the function by the argument's type. In Scala, a sealed trait plus a match is the everyday replacement for Visitor, and the compiler warns when a new case is not handled.",
    code: { python: idiomaticPy, scala: idiomaticScala },
  },
  realWorldUses: [
    "Python's ast.NodeVisitor: linters and code formatters write visit_FunctionDef, visit_Call and so on.",
    "Compilers and interpreters walking syntax trees, such as type checkers and code generators.",
    "Document exporters: one visitor per output format over the same document tree.",
    "Static analysis tools and database query planners working on expression trees.",
  ],
  whenToUse: [
    "The set of element classes is stable, but new operations are added often.",
    "The operations are unrelated to the elements' main job (tax, export, reporting).",
    "You walk a Composite tree and need many different operations over it.",
  ],
  whenNotToUse: [
    "Element types change often: every new type means updating every visitor.",
    "There are only one or two operations: plain methods are simpler.",
  ],
  pros: [
    "A new operation is a new visitor class, with no change to the elements (Open/Closed for operations).",
    "All the logic for one operation lives in one class (Single Responsibility).",
    "A visitor can collect state as it walks a structure, such as a running total or output lines.",
  ],
  cons: [
    "Adding an element type breaks every visitor.",
    "Visitors often need access to element internals, which weakens encapsulation.",
    "The accept and visit back-and-forth is hard for newcomers to follow.",
  ],
  confusedWith: [
    { name: "Iterator", difference: "Iterator gives access to elements one by one; Visitor runs a type-specific operation on each element. They are often used together." },
    { name: "Strategy", difference: "Strategy is one interchangeable algorithm; Visitor is a family of operations chosen by element type." },
    { name: "Composite", difference: "Composite builds the tree; Visitor is a common way to run operations over that tree." },
  ],
  solid:
    "Open/Closed for new operations (add a visitor, not a method on every class) and Single Responsibility (operation logic is kept apart from the data classes). Note that it is not Open/Closed for new element types.",
  interviewUses: [
    "Shopping cart tax and shipping calculation.",
    "File-system reports (size, count, permissions) over a Composite tree.",
    "Expression evaluators and pretty-printers.",
    "Insurance or discount rules per customer or item type.",
  ],
  examples: [
    {
      id: "expr",
      domain: "Developer tools",
      title: "Calculator expression tree",
      situation:
        "A calculator app parses input into a tree of numbers, additions and multiplications. It needs to evaluate the tree, print it back for the user and convert it to postfix for a stack machine, and the node classes were growing a new method for each feature.",
      roles: [
        { role: "Visitor", name: "ExprVisitor" },
        { role: "Concrete visitor", name: "EvalVisitor, PrintVisitor, PostfixVisitor" },
        { role: "Element", name: "Expr" },
        { role: "Concrete element", name: "Num, Add, Mul" },
      ],
      why: "Node types almost never change, but new operations keep coming. Each operation becomes one visitor, and the visitor walks the tree by calling accept on the child nodes.",
      goodToKnow:
        "The visitor is generic in its result type: EvalVisitor returns a number, and PrintVisitor and PostfixVisitor return text, all from the same accept method.",
      walkthrough: [
        "The demo builds the tree for (2 + 3) * 4 + 1, as a parser would.",
        "tree.accept(PrintVisitor) calls visit_add on the root, which asks both children to accept the same visitor.",
        "The recursion reaches the Num leaves and joins the text back up into ((2 + 3) * 4 + 1).",
        "PostfixVisitor walks the same tree and puts each operator after its operands: 2 3 + 4 * 1 +.",
        "EvalVisitor walks it once more and returns 21.",
      ],
      code: { python: ex1Py, scala: ex1Scala },
    },
    {
      id: "export",
      domain: "Media and publishing",
      title: "Article export and word count",
      situation:
        "A travel blog stores each article as a list of blocks: headings, paragraphs and images. Editors want Markdown export today, word counts for the reading-time label, and maybe HTML and AMP later.",
      roles: [
        { role: "Visitor", name: "BlockVisitor" },
        { role: "Concrete visitor", name: "MarkdownExporter, WordCounter" },
        { role: "Element", name: "Block" },
        { role: "Concrete element", name: "Heading, Paragraph, Image" },
      ],
      why: "Every export format is one visitor, so adding HTML later means one new class and no change to the block classes. The visitors keep state (lines, counts) as they walk the article.",
      goodToKnow:
        "A stateful visitor should be created fresh for each run; reusing one would keep counting from the last article.",
      walkthrough: [
        "The article has two headings, two paragraphs and one image.",
        "The loop passes each block to both the exporter and the counter.",
        "MarkdownExporter turns a level-2 heading into ## and an image into ![caption](path).",
        "WordCounter counts words in headings and paragraphs and counts images separately.",
        "The demo prints the Markdown, then 21 words and 1 image.",
      ],
      code: { python: ex2Py, scala: ex2Scala },
    },
    {
      id: "claims",
      domain: "Healthcare",
      title: "Insurance claim rules",
      situation:
        "A health insurer processes claims made of consultations, lab tests and surgeries. Each policy rule (coverage, pre-authorisation, fraud checks) treats each item type differently, and most rules only care about one or two types.",
      roles: [
        { role: "Visitor", name: "ClaimVisitor" },
        { role: "Concrete visitor", name: "CoverageVisitor, PreAuthVisitor" },
        { role: "Element", name: "ClaimItem" },
        { role: "Concrete element", name: "Consultation, LabTest, Surgery" },
      ],
      why: "Each rule is one visitor, so the claim item classes stay simple data. A base visitor with a fallback lets a rule override only the item types it cares about, just like ast.NodeVisitor's generic_visit.",
      goodToKnow:
        "A fallback is convenient, but it also hides a missing case: when a new item type is added, no visitor will complain. Use abstract methods when every rule must handle every type.",
      walkthrough: [
        "The claim has a ₹800 consultation, a ₹450 lab test and a ₹120,000 surgery.",
        "CoverageVisitor pays 80% of the consultation, all of the lab test and 90% of the surgery, capped at ₹100,000.",
        "The insurer pays ₹101,090 and the patient pays ₹20,160.",
        "PreAuthVisitor overrides only visit_surgery; the other items use the fallback and return zero.",
        "The surgery is over ₹50,000, so ₹120,000 needs pre-authorisation.",
      ],
      code: { python: ex3Py, scala: ex3Scala },
    },
    {
      id: "devices",
      domain: "IoT and smart home",
      title: "Smart home device reports",
      situation:
        "A smart home app manages thermostats, cameras and door locks from different makers. It needs a daily energy report and a health check, and soon a firmware audit, but the device classes come from a shared library the app team should not keep editing.",
      roles: [
        { role: "Visitor", name: "DeviceVisitor" },
        { role: "Concrete visitor", name: "EnergyVisitor, HealthCheckVisitor" },
        { role: "Element", name: "Device" },
        { role: "Concrete element", name: "Thermostat, Camera, DoorLock" },
      ],
      why: "Reports change much more often than device types. Each report is a visitor with its own result type: energy returns a number and the health check returns a status message.",
      goodToKnow:
        "Visitor only works if the element classes already have accept(). If you cannot add it to a library's classes, use type matching instead (singledispatch in Python, match in Scala).",
      walkthrough: [
        "The home has a bedroom AC thermostat, a 4K gate camera and a front-door lock.",
        "For each device, the loop runs EnergyVisitor and HealthCheckVisitor through the same accept method.",
        "The thermostat uses 7.20 kWh in six hours and its 24 °C target is fine.",
        "The camera has only 3 GB free, so the health check says storage is low.",
        "The lock battery is at 15%, so it needs replacing, and the total is 7.69 kWh a day.",
      ],
      code: { python: ex4Py, scala: ex4Scala },
    },
  ],
};

export default lesson;
