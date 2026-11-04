import type { PatternQuiz } from "../../../anim/types";

const quiz: PatternQuiz = {
  slug: "visitor",
  questions: [
    {
      type: "mcq", tag: "Concept", prompt: "What does the Visitor pattern make easy?",
      options: [
        "Adding new element types without touching existing code",
        "Adding new operations over a stable set of element classes without editing those classes",
        "Walking a collection one element at a time without exposing its structure",
        "Sharing one instance across the whole program"
      ],
      answer: 1,
      hint: "Think of the cart: what did we add without editing Book, Electronics or Grocery?",
      explain: "Each new operation (tax, shipping, points) is a new visitor class, and the element classes stay untouched. Adding a new element type is the hard direction: every visitor needs a new method. Walking a collection is Iterator, and a single shared instance is Singleton."
    },
    {
      type: "bug", tag: "Find the problem", prompt: "Tap the line that breaks double dispatch.",
      code: { lang: "python", text: `class Book(Item):
    def accept(self, visitor: ItemVisitor) -> float:
        return visitor.visit_book(self)


class Grocery(Item):
    def accept(self, visitor: ItemVisitor) -> float:
        return visitor.visit_book(self)` },
      answer: 8,
      hint: "Each element must call the visit method for its own type.",
      explain: "Line 8 makes Grocery call visit_book, so every visitor treats groceries as books (tax 0, shipping ₹40). accept must call the method that matches its own class: visitor.visit_grocery(self)."
    },
    {
      type: "mcq", tag: "Which pattern?", prompt: "Which pattern does this Scala code use?",
      code: { lang: "scala", text: `trait ShapeVisitor[R]:
  def visitCircle(c: Circle): R
  def visitSquare(s: Square): R

sealed trait Shape:
  def accept[R](v: ShapeVisitor[R]): R

case class Circle(r: Double) extends Shape:
  def accept[R](v: ShapeVisitor[R]): R = v.visitCircle(this)

object AreaVisitor extends ShapeVisitor[Double]:
  def visitCircle(c: Circle) = math.Pi * c.r * c.r
  def visitSquare(s: Square) = s.side * s.side` },
      options: ["Strategy", "Composite", "Visitor", "Iterator"],
      answer: 2,
      hint: "Look for accept() calling back a method named after the element's own type.",
      explain: "Shapes have accept(v), which calls v.visitCircle(this): that is double dispatch, the heart of Visitor. Strategy has no accept callback, Composite builds trees of parts, and Iterator walks a collection."
    },
    {
      type: "mcq", tag: "Scenario",
      prompt: "A payments app adds a new payment type (UPI, cards, wallets, BNPL...) every month, but has only two operations on them: fee and refund. Should it use Visitor?",
      options: [
        "Yes: Visitor makes new types easy to add",
        "No: types change often and operations rarely, so plain methods (or Strategy) fit better",
        "Yes: every app with more than one class should use Visitor",
        "No: use Singleton for each payment type instead"
      ],
      answer: 1,
      hint: "Which side does Visitor keep cheap to change: new operations, or new element types?",
      explain: "Visitor is good when element types are stable and operations grow. Here it is the opposite: each new payment type would mean a new visit method in every visitor. Methods on each type, or Strategy, are simpler. Singleton does not address the problem."
    },
    {
      type: "order", tag: "Put in order", prompt: "Put the steps of electronics.accept(TaxVisitor()) in the right order.",
      steps: [
        "The client calls electronics.accept(tax_visitor)",
        "Electronics.accept calls visitor.visit_electronics(self)",
        "TaxVisitor.visit_electronics works out 18% of the price",
        "The tax amount is returned through accept to the client"
      ],
      shuffled: [1, 3, 0, 2],
      hint: "First dispatch on the element, then on the visitor.",
      explain: "The client calls accept on the element (first dispatch, picks the element type), the element calls the matching visit method on the visitor (second dispatch, picks the operation), the visitor does the work, and the value comes back through accept."
    },
    {
      type: "diagram", tag: "Read the diagram", prompt: "Which class diagram shows Visitor correctly?",
      options: [
        {
          label: "Book has tax and shipping methods; Grocery has the same methods.",
          width: 330, height: 200,
          nodes: [
            { id: "b", kind: "concrete", name: "Book", members: ["+ tax()", "+ shipping()"], at: { x: 20, y: 50, w: 130 } },
            { id: "g", kind: "concrete", name: "Grocery", members: ["+ tax()", "+ shipping()"], at: { x: 180, y: 50, w: 130 } }
          ],
          edges: []
        },
        {
          label: "Item uses the ItemVisitor interface; Book implements Item; TaxVisitor implements ItemVisitor.",
          width: 330, height: 200,
          nodes: [
            { id: "i", kind: "interface", name: "Item", key: true, members: ["+ accept(v)"], at: { x: 8, y: 10, w: 120 } },
            { id: "v", kind: "interface", name: "ItemVisitor", key: true, members: ["+ visit_book(b)"], at: { x: 176, y: 10, w: 146 } },
            { id: "b", kind: "concrete", name: "Book", at: { x: 18, y: 146, w: 100 } },
            { id: "t", kind: "concrete", name: "TaxVisitor", at: { x: 199, y: 146, w: 100 } }
          ],
          edges: [
            { id: "e1", from: "i", to: "v", type: "dependency" },
            { id: "e2", from: "b", to: "i", type: "realization" },
            { id: "e3", from: "t", to: "v", type: "realization" }
          ]
        },
        {
          label: "TaxVisitor inherits from Book; Book inherits from Item.",
          width: 330, height: 200,
          nodes: [
            { id: "i", kind: "interface", name: "Item", at: { x: 105, y: 8, w: 120 } },
            { id: "b", kind: "concrete", name: "Book", at: { x: 115, y: 82, w: 100 } },
            { id: "t", kind: "concrete", name: "TaxVisitor", at: { x: 115, y: 146, w: 100 } }
          ],
          edges: [
            { id: "e1", from: "b", to: "i", type: "realization" },
            { id: "e2", from: "t", to: "b", type: "inheritance" }
          ]
        }
      ],
      answer: 1,
      hint: "Visitor has two hierarchies that meet through accept(v).",
      explain: "B is right: elements implement Item.accept(v), operations implement ItemVisitor, and Item depends only on the visitor interface. A is the original problem, with every operation inside every item. C makes the operation a subclass of an item, so it cannot work on other item types."
    }
  ],
  cards: [
    { id: "v-intent", front: "Visitor: what is its intent, in one line?", back: "Add new operations to a stable set of classes by putting each operation in its own visitor class; elements just accept(v) and call the matching visit method." },
    { id: "v-vs-strategy", front: "Visitor vs Strategy?", back: "Strategy: one interchangeable algorithm with one method. Visitor: one operation with a separate method per element type, picked by double dispatch." },
    { id: "v-solid", front: "Which SOLID principles does Visitor apply, and where does it fall short?", back: "Open/Closed for new operations and Single Responsibility (each operation in one class). It is not Open/Closed for new element types: each one edits every visitor." },
    { id: "v-spot", front: "Which pattern is hiding here?", code: { lang: "python", text: `class FindCalls(ast.NodeVisitor):
    def visit_Call(self, node):
        print(node.func.id)
        self.generic_visit(node)` }, back: "Visitor. ast.NodeVisitor dispatches each syntax-tree node to visit_<NodeType>; you write only the visit methods you need." },
    { id: "uml-dependency", front: "UML: what does a dashed line with an open arrowhead mean?", back: "Dependency: one class uses another briefly, for example as a method parameter. Item depends on ItemVisitor because accept(v) takes one." },
    { id: "v-when-not", front: "When should you NOT use Visitor?", back: "When element types change often (every visitor must change), or there are only one or two operations (plain methods are simpler). In Scala, a sealed trait plus match is often enough." }
  ]
};

export default quiz;
