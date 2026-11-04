import type { Exercise } from "../../../review/types";

const exercise: Exercise = {
  slug: "visitor",
  task: "Book, Electronics and Grocery each carry their own tax, shipping and loyalty_points, so every new operation means editing every item class. Refactor them into the Visitor pattern so a new operation is one new class and the item classes stay untouched.",
  goals: [
    "A visitor (an ABC in Python, a trait in Scala) with one visit method per item type",
    "Each item has an accept(visitor) that calls the visit method for its own type",
    "The shared item type (Item) declares accept, so the cart can call it on any item",
    "Each operation (tax, shipping, points) is its own visitor class that handles every item type",
    "No isinstance checks or type matches inside the visitors"
  ],
  hints: [
    "Turn the question around: instead of each item knowing every operation, make each operation a class that knows every item.",
    "Write ItemVisitor with visit_book, visit_electronics and visit_grocery (visitBook, ... in Scala). Move the bodies of tax into a TaxVisitor that implements them.",
    "In each item, replace the operations with one method: def accept(self, visitor): return visitor.visit_book(self) in Book (v.visitBook(this) in Scala), and so on. The cart then calls item.accept(TaxVisitor())."
  ]
};

export default exercise;
