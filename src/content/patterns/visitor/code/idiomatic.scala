sealed trait Item
final case class Book(price: Double) extends Item
final case class Electronics(price: Double, warrantyYears: Int) extends Item
final case class Grocery(price: Double, weightKg: Double) extends Item

// sealed trait: the compiler warns if a new Item type is not handled here
def tax(item: Item): Double = item match
  case Book(_)               => 0
  case Electronics(price, _) => price * 0.18
  case Grocery(price, _)     => price * 0.05

@main def idiomaticDemo(): Unit =
  val cart: List[Item] = List(Book(499), Electronics(15000, 1), Grocery(300, 2.5))
  println(s"tax: ${cart.map(tax).sum}")
