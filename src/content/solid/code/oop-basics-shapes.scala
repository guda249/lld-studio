trait Shape: // a trait used as an interface: says WHAT every shape can do, not HOW
  def area: Double
  def name: String

class Circle(radius: Double) extends Shape: // implements the trait
  def area: Double = math.Pi * radius * radius
  def name: String = "circle"

class Rectangle(width: Double, height: Double) extends Shape:
  def area: Double = width * height
  def name: String = "rectangle"

class Square(side: Double) extends Rectangle(side, side): // inheritance: reuses Rectangle's code
  override def name: String = "square"

def report(shapes: List[Shape]): Unit = // polymorphism: one call, the right code runs
  for s <- shapes do println(f"${s.name}: ${s.area}%.1f")

@main def oopBasicsShapes(): Unit =
  report(List(Circle(1), Rectangle(2, 3), Square(4)))
