import scala.collection.mutable

class PriceDisplay:
  def show(symbol: String, price: Double): Unit =
    println(f"Display  $symbol: ₹$price%,.2f")

class PriceAlert:
  def check(symbol: String, price: Double): Unit =
    if price >= 1900 then println(s"Alert    $symbol crossed ₹1,900")

class StockTicker:
  private val prices = mutable.Map.empty[String, Double]
  private val display = PriceDisplay()   // hard-wired consumer
  private val alerts = PriceAlert()      // hard-wired consumer

  def setPrice(symbol: String, price: Double): Unit =
    prices(symbol) = price
    display.show(symbol, price)
    alerts.check(symbol, price)
    // a mobile push service? edit this class again

@main def observerProblem(): Unit =
  val ticker = StockTicker()
  ticker.setPrice("INFY", 1875.50)
  ticker.setPrice("INFY", 1912.00)
  println("The ticker knows every consumer by name.")
