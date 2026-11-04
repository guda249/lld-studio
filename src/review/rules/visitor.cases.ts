import type { ReviewCase } from "../cases";
import type { UmlModel } from "../types";

/** The learner drew the visitor implementations as plain associations. */
const diagram: UmlModel = {"classes":[{"id":"ShapeVisitor","name":"ShapeVisitor","kind":"interface","members":[]},{"id":"AreaVisitor","name":"AreaVisitor","kind":"concrete","members":[]},{"id":"Shape","name":"Shape","kind":"interface","members":[]},{"id":"Circle","name":"Circle","kind":"concrete","members":[]},{"id":"Square","name":"Square","kind":"concrete","members":[]}],"relations":[{"id":"a","from":"AreaVisitor","to":"ShapeVisitor","type":"association"},{"id":"b","from":"Circle","to":"Shape","type":"realization"},{"id":"c","from":"Square","to":"Shape","type":"realization"}]};

const cases: ReviewCase[] = [
  {
    name: "1 Python, correct, other domain (shapes)",
    lang: "python",
    expect: {"found":true,"ids":["visitor.shape","visitor.double-dispatch","visitor.complete-visitors"],"none":["visitor.wrong-visit","visitor.missing-visit","visitor.missing-accept"]},
    code: `from abc import ABC, abstractmethod
import math

class ShapeVisitor(ABC):
    @abstractmethod
    def visit_circle(self, c: "Circle") -> float: ...
    @abstractmethod
    def visit_square(self, s: "Square") -> float: ...

class Shape(ABC):
    @abstractmethod
    def accept(self, v: ShapeVisitor) -> float: ...

class Circle(Shape):
    def __init__(self, r: float) -> None:
        self.r = r
    def accept(self, v: ShapeVisitor) -> float:
        return v.visit_circle(self)

class Square(Shape):
    def __init__(self, side: float) -> None:
        self.side = side
    def accept(self, v: ShapeVisitor) -> float:
        return v.visit_square(self)

class AreaVisitor(ShapeVisitor):
    def visit_circle(self, c: Circle) -> float: return math.pi * c.r ** 2
    def visit_square(self, s: Square) -> float: return s.side ** 2

class PerimeterVisitor(ShapeVisitor):
    def visit_circle(self, c: Circle) -> float: return 2 * math.pi * c.r
    def visit_square(self, s: Square) -> float: return 4 * s.side

for shape in [Circle(1), Square(2)]:
    print(shape.accept(AreaVisitor()), shape.accept(PerimeterVisitor()))`
  },
  {
    name: "2 Python, buggy: wrong visit method and an incomplete visitor",
    lang: "python",
    diagram,
    expect: {"found":true,"ids":["visitor.wrong-visit","visitor.missing-visit","uml.rel-type"],"none":["visitor.double-dispatch"]},
    code: `from abc import ABC, abstractmethod

class ShapeVisitor(ABC):
    @abstractmethod
    def visit_circle(self, c: "Circle") -> float: ...
    @abstractmethod
    def visit_square(self, s: "Square") -> float: ...

class Shape(ABC):
    @abstractmethod
    def accept(self, v: ShapeVisitor) -> float: ...

class Circle(Shape):
    def accept(self, v: ShapeVisitor) -> float:
        return v.visit_circle(self)

class Square(Shape):
    def accept(self, v: ShapeVisitor) -> float:
        return v.visit_circle(self)

class AreaVisitor(ShapeVisitor):
    def visit_circle(self, c: Circle) -> float: return 3.14`
  },
  {
    name: "3 Scala 3, correct (generic visitor, object visitors)",
    lang: "scala",
    expect: {"found":true,"ids":["visitor.double-dispatch","visitor.complete-visitors"],"none":["visitor.wrong-visit","visitor.base-lacks-accept"]},
    code: `trait FileVisitor[R]:
  def visitText(f: TextFile): R
  def visitImage(f: ImageFile): R

sealed trait FileNode:
  def accept[R](v: FileVisitor[R]): R

final case class TextFile(name: String, lines: Int) extends FileNode:
  def accept[R](v: FileVisitor[R]): R = v.visitText(this)

final case class ImageFile(name: String, kb: Int) extends FileNode:
  def accept[R](v: FileVisitor[R]): R = v.visitImage(this)

object SizeVisitor extends FileVisitor[Int]:
  def visitText(f: TextFile): Int = f.lines * 80
  def visitImage(f: ImageFile): Int = f.kb * 1024

@main def demo(): Unit =
  val files: List[FileNode] = List(TextFile("a.txt", 10), ImageFile("b.png", 4))
  println(files.map(_.accept(SizeVisitor)).sum)`
  },
  {
    name: "4 Scala 3, buggy: an element without accept, and a type match inside the visitor",
    lang: "scala",
    expect: {"found":true,"ids":["visitor.missing-accept","visitor.element-not-covered","visitor.type-checks"]},
    code: `trait FileVisitor:
  def visitText(f: TextFile): Int
  def visitImage(f: ImageFile): Int

sealed trait FileNode:
  def accept(v: FileVisitor): Int

class TextFile(val lines: Int) extends FileNode:
  def accept(v: FileVisitor): Int = v.visitText(this)

class ImageFile(val kb: Int) extends FileNode:
  def accept(v: FileVisitor): Int = v.visitImage(this)

class Folder(val kids: List[FileNode]) extends FileNode

class SizeVisitor extends FileVisitor:
  def visitText(f: TextFile): Int = f.lines * 80
  def visitImage(f: ImageFile): Int =
    f match
      case t: ImageFile => t.kb * 1024`
  },
  {
    name: "5 Python, not Visitor: every operation copied into every class",
    lang: "python",
    expect: {"found":false,"ids":["visitor.no-shape","visitor.operations-in-elements"]},
    code: `class Car:
    def insurance(self) -> int: return 500
    def road_tax(self) -> int: return 100

class Truck:
    def insurance(self) -> int: return 900
    def road_tax(self) -> int: return 300`
  }
];

export default cases;
