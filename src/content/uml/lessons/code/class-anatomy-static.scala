abstract class Shape:                     // abstract class: name in italics
  def area(): Double                      // abstract operation: italics, no body
  def describe(): String = f"${getClass.getSimpleName} with area ${area()}%.1f"

class Circle(radius: Double) extends Shape:
  Circle.count += 1
  def area(): Double = math.Pi * radius * radius

object Circle:
  var count: Int = 0                      // static: underlined, one value for the class

@main def demo(): Unit =
  println(s"${Circle(1).describe()} ${Circle(2).describe()}")
  println(s"circles made: ${Circle.count}")   // circles made: 2
