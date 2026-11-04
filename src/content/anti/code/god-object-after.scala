// After: each class owns one job; Checkout only coordinates them.
import scala.collection.mutable

class Pricing(prices: Map[String, Int]):
  def total(items: Map[String, Int]): Int =
    val raw = items.map((n, q) => prices(n) * q).sum
    if raw > 300 then math.round(raw * 0.9).toInt else raw

class Inventory(stock: mutable.Map[String, Int]):
  def missing(items: Map[String, Int]): Option[String] =
    items.collectFirst { case (n, q) if stock.getOrElse(n, 0) < q => n }
  def take(items: Map[String, Int]): Unit =
    for (name, qty) <- items do stock(name) -= qty

class OrderBook:
  private val orders = mutable.ListBuffer.empty[(String, String, Int)]
  def save(email: String, total: Int): String =
    val orderId = s"O${orders.size + 1}"
    orders += ((orderId, email, total))
    orderId

class Mailer:
  val outbox = mutable.ListBuffer.empty[String]
  def send(to: String, text: String): Unit = outbox += s"To $to: $text"

class Checkout(pricing: Pricing, inventory: Inventory, book: OrderBook, mailer: Mailer): // coordinates only
  def placeOrder(email: String, items: Map[String, Int]): String =
    inventory.missing(items) match
      case Some(name) => s"Sorry, $name is out of stock"
      case None =>
        val total = pricing.total(items)
        inventory.take(items)
        val orderId = book.save(email, total)
        mailer.send(email, s"order $orderId, total $total")
        orderId

@main def godObjectAfter(): Unit =
  val mailer = Mailer()
  val checkout = Checkout(Pricing(Map("pen" -> 20, "book" -> 150)), Inventory(mutable.Map("pen" -> 10, "book" -> 2)), OrderBook(), mailer)
  println(checkout.placeOrder("asha@example.com", Map("book" -> 2, "pen" -> 1)))
  println(checkout.placeOrder("ravi@example.com", Map("book" -> 1)))
  println(mailer.outbox.head)
