class Stock:
  private val left = Map("pen" -> 5, "ink" -> 0)
  def reserve(item: String): Boolean = left.getOrElse(item, 0) > 0

class Checkout(stock: Stock):
  def run(items: List[String]): String =
    var ok = true
    for item <- items do  // loop
      ok = stock.reserve(item) && ok
    if ok then "charged"  // alt [ok]
    else "cancelled"  // [else]

@main def demo(): Unit =
  println(Checkout(Stock()).run(List("pen")))  // charged
  println(Checkout(Stock()).run(List("pen", "ink")))  // cancelled
