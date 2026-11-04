import scala.collection.mutable

trait Observer:
  def update(symbol: String, price: Double): Unit

class StockTicker:                                       // subject / publisher
  private val observers = mutable.ListBuffer.empty[Observer]
  private val prices = mutable.Map.empty[String, Double]

  def subscribe(o: Observer): Unit = observers += o

  def unsubscribe(o: Observer): Unit = observers -= o

  def setPrice(symbol: String, price: Double): Unit =
    prices(symbol) = price
    notifySubscribers(symbol, price)

  private def notifySubscribers(symbol: String, price: Double): Unit =
    observers.toList.foreach(_.update(symbol, price))   // copy: an observer may unsubscribe mid-loop

class PriceDisplay extends Observer:
  def update(symbol: String, price: Double): Unit = println(f"$symbol: ₹$price%,.2f")

class PriceAlert(symbol: String, threshold: Double) extends Observer:
  val triggered = mutable.ListBuffer.empty[String]

  def update(s: String, price: Double): Unit =
    if s == symbol && price >= threshold then
      triggered += f"$s crossed ₹$threshold%,.0f at ₹$price%,.2f"

@main def observerDemo(): Unit =
  val ticker = StockTicker()
  val display = PriceDisplay()
  val alert = PriceAlert("INFY", 1900)
  ticker.subscribe(display)
  ticker.subscribe(alert)

  ticker.setPrice("INFY", 1875.50)
  ticker.setPrice("INFY", 1912.00)
  ticker.unsubscribe(display)
  ticker.setPrice("INFY", 1930.25)                       // only the alert hears this one
  println(alert.triggered.mkString("[", ", ", "]"))
