// The system box. Each public method is one thing a customer can do.
class Shop:
  def browseItems(): List[String] = List("tea", "mug")
  def placeOrder(item: String): String = pay(item)   // placing an order always includes paying
  private def pay(item: String): String = s"paid for $item"

@main def demo(): Unit =
  val shop = Shop()                       // the Customer actor uses the shop
  println(shop.browseItems())
  println(shop.placeOrder("tea"))
