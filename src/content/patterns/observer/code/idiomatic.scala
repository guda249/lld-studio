import scala.collection.mutable

type Listener = (String, Double) => Unit

class StockTicker:
  private val listeners = mutable.ListBuffer.empty[Listener]

  def subscribe(listener: Listener): () => Unit =
    listeners += listener
    () => listeners -= listener                       // call it to unsubscribe

  def setPrice(symbol: String, price: Double): Unit =
    listeners.toList.foreach(l => l(symbol, price))

@main def observerIdiomatic(): Unit =
  val ticker = StockTicker()
  val seen = mutable.ListBuffer.empty[Double]
  val stopPrinting = ticker.subscribe((s, p) => println(f"$s -> ₹$p%,.2f"))
  ticker.subscribe((_, p) => seen += p)

  ticker.setPrice("TCS", 3850.0)
  stopPrinting()                                      // the printer leaves
  ticker.setPrice("TCS", 3902.5)
  println(s"Prices seen by the logger: ${seen.mkString("[", ", ", "]")}")
