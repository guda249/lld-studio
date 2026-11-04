// Before: one ShopManager knows prices, stock, saving orders and sending emails.
import scala.collection.mutable

class ShopManager:
  val prices = Map("pen" -> 20, "book" -> 150)
  val stock = mutable.Map("pen" -> 10, "book" -> 2)
  val orders = mutable.ListBuffer.empty[(String, String, Int)]
  val outbox = mutable.ListBuffer.empty[String]

  def placeOrder(email: String, items: Map[String, Int]): String =
    items.find((name, qty) => stock.getOrElse(name, 0) < qty) match // stock rules
      case Some((name, _)) => s"Sorry, $name is out of stock"
      case None =>
        val raw = items.map((n, q) => prices(n) * q).sum // pricing rules
        val total = if raw > 300 then math.round(raw * 0.9).toInt else raw
        for (name, qty) <- items do stock(name) -= qty // stock again
        val orderId = s"O${orders.size + 1}" // saving
        orders += ((orderId, email, total))
        outbox += s"To $email: order $orderId, total $total" // email
        orderId

  def restock(name: String, qty: Int): Unit = stock(name) = stock.getOrElse(name, 0) + qty

  def salesReport(): String = s"${orders.size} orders, ${orders.map(_._3).sum} rupees"

@main def godObjectBefore(): Unit =
  val shop = ShopManager()
  println(shop.placeOrder("asha@example.com", Map("book" -> 2, "pen" -> 1)))
  println(shop.placeOrder("ravi@example.com", Map("book" -> 1)))
  println(s"${shop.salesReport()} | ${shop.outbox.head}")
