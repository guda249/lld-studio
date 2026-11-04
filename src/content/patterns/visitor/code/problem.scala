// Every new operation (tax, shipping, points, CSV export...) is added to EVERY item class.
trait Item:
  def tax: Double
  def shipping: Double
  def loyaltyPoints: Int

final case class Book(price: Double) extends Item:
  def tax: Double = 0
  def shipping: Double = 40
  def loyaltyPoints: Int = (price / 100).toInt

final case class Electronics(price: Double) extends Item:
  def tax: Double = price * 0.18
  def shipping: Double = if price >= 10000 then 0 else 100
  def loyaltyPoints: Int = (price / 200).toInt

final case class Grocery(price: Double, weightKg: Double) extends Item:
  def tax: Double = price * 0.05
  def shipping: Double = 20 * weightKg
  def loyaltyPoints: Int = 0

@main def problemDemo(): Unit =
  val cart: List[Item] = List(Book(499), Electronics(15000), Grocery(300, 2.5))
  println(s"tax: ${cart.map(_.tax).sum} | shipping: ${cart.map(_.shipping).sum} | points: ${cart.map(_.loyaltyPoints).sum}")
