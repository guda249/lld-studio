/**
 * UML Basics, lesson 9: the closing quiz. No concepts; ten questions across every UML Basics lesson, with the six
 * relationships covered from several angles.
 */
import type { UmlLesson } from "../../guides/types";

const lesson: UmlLesson = {
  id: "quiz",
  order: 9,
  title: "UML Basics quiz",
  lede:
    "Ten questions across all of UML Basics: diagram types, the class box, the six relationships, multiplicity, sequence, state, activity and use-case diagrams. Each answer explains why it is right and why the others are wrong, so a miss is still a lesson.",
  concepts: [],
  practiceTitle: "UML Basics quiz",
  practice: [
    {
      type: "mcq",
      tag: "Concept",
      prompt: "You want to show how a login request travels from the browser through the API to the database, call by call, over time. Which diagram fits best?",
      options: ["Class diagram", "Sequence diagram", "Use-case diagram", "State machine diagram"],
      answer: 1,
      hint: "The question is about the order of calls between objects.",
      explain:
        "A sequence diagram shows lifelines and the messages between them from top to bottom, in time order. A class diagram shows structure, not calls. A use-case diagram shows who uses the system, with no steps. A state machine shows how one object changes state, not calls between several."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "In a class box, what does - balance: float mean?",
      options: [
        "A private attribute called balance of type float",
        "A public method called balance that returns a float",
        "A static attribute shared by all objects",
        "An attribute that has been removed from the class"
      ],
      answer: 0,
      hint: "The sign at the front is about visibility; brackets would mean a method.",
      explain:
        "A minus sign means private, and name: type with no brackets is an attribute. A method would have brackets, like balance(): float. Static members are underlined, not marked with a minus. UML has no sign for removed members."
    },
    {
      type: "mcq",
      tag: "Read the diagram",
      code: { lang: "python", text: "class Report:\n    def export(self, writer: PdfWriter) -> None:\n        writer.write(\"Q3 numbers\")" },
      prompt: "Which relationship does Report have with PdfWriter?",
      options: ["Dependency (dashed line, open arrow)", "Association (solid line, open arrow)", "Composition (filled diamond)", "Realization (dashed line, hollow triangle)"],
      answer: 0,
      hint: "Is the writer kept in a field?",
      explain:
        "PdfWriter is only a method parameter and is never stored, which is a dependency. An association needs a field that keeps the reference. Composition needs Report to create and own the writer. Realization would need Report to implement PdfWriter as an interface."
    },
    {
      type: "mcq",
      tag: "Read the diagram",
      code: { lang: "scala", text: "class House:\n  val rooms = List(Room(\"Kitchen\"), Room(\"Bedroom\"))\n\nclass Room(val name: String)" },
      prompt: "Which relationship does House have with Room?",
      options: ["Aggregation (hollow diamond at House)", "Composition (filled diamond at House)", "Inheritance (hollow triangle at House)", "Dependency (dashed line)"],
      answer: 1,
      hint: "Who creates the rooms, and can they exist without the house?",
      explain:
        "House creates its own rooms and nobody else holds them, so they live and die with it: composition. Aggregation would mean the rooms were made outside and passed in. Inheritance would need Room extends House. A dependency is a parameter that is not kept, but here the rooms are a field."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "Which pair of relationships both use a hollow triangle at the end of the line?",
      options: ["Inheritance and realization", "Aggregation and composition", "Association and dependency", "Composition and inheritance"],
      answer: 0,
      hint: "Both are is-a or can-do relationships; the triangle points at the general type.",
      explain:
        "Inheritance (solid line) and realization (dashed line) both end in a hollow triangle at the parent or interface. Aggregation and composition use diamonds at the whole. Association and dependency use an open arrow. Composition has a filled diamond, not a triangle."
    },
    {
      type: "bug",
      tag: "Find the problem",
      prompt: "The diagram says Order has 1..* LineItem (at least one). Which line lets the code break that rule?",
      code: {
        lang: "python",
        text:
          "class LineItem:\n    def __init__(self, product: str):\n        self.product = product\n\nclass Order:\n    def __init__(self, first: LineItem):\n        self.items = [first]\n\n    def remove(self, item: LineItem) -> None:\n        self.items.remove(item)\n\norder = Order(LineItem(\"Pen\"))\nprint(len(order.items))"
      },
      answer: 10,
      hint: "The constructor already makes sure there is one item. What can take it away?",
      explain:
        "Line 10 removes an item with no check, so an order can end up with zero items, which breaks 1..*. The constructor (lines 6 and 7) does the right thing by requiring a first item. The fix is to refuse to remove the last item, for example by raising an error when only one is left."
    },
    {
      type: "mcq",
      tag: "Read the diagram",
      prompt: "In a sequence diagram, what does a dashed arrow going back from the callee to the caller usually show?",
      options: ["The return of a call", "A new object being created", "A call that runs at the same time", "A dependency between two classes"],
      answer: 0,
      hint: "A solid arrow is the call; what comes after it?",
      explain:
        "A dashed arrow back to the caller is the return message, often labelled with the value. Creating an object is drawn as a call to the new lifeline's head. Calls that don't wait for an answer use an open arrowhead, not a dashed line. Dependencies belong in class diagrams."
    },
    {
      type: "mcq",
      tag: "Concept",
      prompt: "A state machine has the transition coin [credit >= price] / dispense. What is [credit >= price]?",
      options: ["The guard: the transition only happens when it is true", "The event that triggers the transition", "The action run during the transition", "The name of the next state"],
      answer: 0,
      hint: "The format is event [guard] / action.",
      explain:
        "Square brackets hold the guard, a condition that must be true for the transition to fire. coin is the event that triggers it, dispense (after the slash) is the action. The next state is the box the arrow points to, not part of the label."
    },
    {
      type: "mcq",
      tag: "Scenario",
      prompt: "Checking a parcel's weight and printing its label can happen at the same time, and shipping must wait for both. What do you draw in the activity diagram?",
      options: [
        "A fork bar before the two actions and a join bar after them",
        "A decision diamond before the two actions and a merge diamond after",
        "Two swim lanes and no bars",
        "An «include» arrow between the two actions"
      ],
      answer: 0,
      hint: "All paths run, and the flow waits for all of them.",
      explain:
        "A fork starts both actions in parallel and a join waits for both before shipping. A decision would take only one of the two paths. Swim lanes say who does each action, not whether they overlap. «include» belongs in use-case diagrams."
    },
    {
      type: "order",
      tag: "Put in order",
      prompt: "You are turning a page of code into a class diagram. Put the steps in order.",
      steps: [
        "Draw one box per class",
        "Add the attributes and operations",
        "Draw inheritance and realization lines",
        "Draw dependency, association, aggregation and composition lines"
      ],
      shuffled: [2, 3, 0, 1],
      hint: "Boxes first; the easy lines before the ones that need a decision.",
      explain:
        "Boxes come first so lines have somewhere to go. Members come next, because fields and parameters tell you which has-a lines exist. Is-a lines are easy to spot (extends) and fix where boxes sit. The has-a lines come last because each one needs a choice between four kinds."
    }
  ]
};

export default lesson;
