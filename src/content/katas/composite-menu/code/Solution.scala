import scala.collection.mutable.ListBuffer

def round2(x: Double): Double = BigDecimal(x).setScale(2, BigDecimal.RoundingMode.HALF_UP).toDouble

trait MenuEntry: // component: what every entry can answer
  def name: String
  def price: Double
  def render(depth: Int = 0): String

class Dish(val name: String, unitPrice: Double) extends MenuEntry: // leaf
  def price: Double = unitPrice
  def render(depth: Int = 0): String = f"${"  " * depth}$name: $unitPrice%.2f"

class Combo(val name: String, discount: Double) extends MenuEntry: // composite
  private val entries = ListBuffer.empty[MenuEntry]

  def add(more: MenuEntry*): Combo =
    entries ++= more
    this

  def price: Double = round2(entries.map(_.price).sum * (1 - discount))

  def render(depth: Int = 0): String =
    val head = f"${"  " * depth}$name (-${discount * 100}%.0f%%): $price%.2f"
    (head :: entries.toList.map(_.render(depth + 1))).mkString("\n")

@main def demo(): Unit =
  val kids = Combo("Kids box", 0.10).add(Dish("Mini burger", 4.50), Dish("Apple juice", 2.00))
  val family = Combo("Family deal", 0.20).add(Dish("Large pizza", 14.00), kids, kids)
  println(family.render())
