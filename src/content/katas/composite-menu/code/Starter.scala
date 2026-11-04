import scala.collection.mutable.ListBuffer

class Dish(val name: String, val price: Double)

class Combo(val name: String, val discount: Double):
  val items = ListBuffer.empty[Any]

def round2(x: Double): Double = BigDecimal(x).setScale(2, BigDecimal.RoundingMode.HALF_UP).toDouble

// every function asks "dish or combo?"; adding a Drink with a deposit means editing them all
def priceOf(entry: Any): Double = entry match
  case d: Dish => d.price
  case c: Combo => round2(c.items.map(priceOf).sum * (1 - c.discount))
  case _ => throw IllegalArgumentException("unknown menu entry")

def render(entry: Any, depth: Int = 0): String =
  val pad = "  " * depth
  entry match
    case d: Dish => f"$pad${d.name}: ${d.price}%.2f"
    case c: Combo =>
      val head = f"$pad${c.name} (-${c.discount * 100}%.0f%%): ${priceOf(c)}%.2f"
      (head :: c.items.toList.map(i => render(i, depth + 1))).mkString("\n")
    case _ => throw IllegalArgumentException("unknown menu entry")

@main def demo(): Unit =
  val kids = Combo("Kids box", 0.10)
  kids.items ++= List(Dish("Mini burger", 4.50), Dish("Apple juice", 2.00))
  val family = Combo("Family deal", 0.20)
  family.items ++= List(Dish("Large pizza", 14.00), kids, kids)
  println(render(family))
