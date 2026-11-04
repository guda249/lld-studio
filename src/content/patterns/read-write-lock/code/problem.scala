import java.util.concurrent.ConcurrentHashMap
import scala.jdk.CollectionConverters.*

class PriceCatalog(initial: Map[String, Int]):
  private var prices = initial
  private var inside = 0
  var peakInside = 0

  def quote(cart: List[String]): Int = synchronized: // a reader shuts out every other reader too
    inside += 1
    peakInside = math.max(peakInside, inside)
    val total = cart.map(prices).sum // imagine 50 ms of work here
    inside -= 1
    total

  def setPrice(sku: String, price: Int): Unit = synchronized:
    prices = prices.updated(sku, price)

@main def readWriteLockProblem(): Unit =
  val catalog = PriceCatalog(Map("kurta" -> 1200, "saree" -> 3500, "dupatta" -> 600))
  val carts = Map("Asha" -> List("kurta", "dupatta"), "Ravi" -> List("saree"), "Meera" -> List("kurta"), "Vikram" -> List("saree", "kurta"))
  val quotes = ConcurrentHashMap[String, Int]()
  val shoppers = carts.toList.map((name, cart) => Thread(() => { quotes.put(name, catalog.quote(cart)); () }))
  shoppers.foreach(_.start())
  shoppers.foreach(_.join())

  println("Quotes: " + quotes.asScala.toList.sorted.map((n, q) => s"$n ₹$q").mkString(", "))
  println(s"Peak readers inside at once: ${catalog.peakInside}")
  println(s"Reads never change the prices, yet they queued: ${carts.size} × 50 ms = ${carts.size * 50} ms instead of 50 ms")
