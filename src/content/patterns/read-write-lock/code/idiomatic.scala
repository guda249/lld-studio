import java.util.concurrent.atomic.AtomicReference

// Copy-on-write: readers take no lock at all; a writer builds a new immutable Map and swaps it in.
class PriceCatalog(initial: Map[String, Int]):
  private val snapshot = AtomicReference(initial)

  def current: Map[String, Int] = snapshot.get()

  def quote(cart: List[String]): Int =
    val prices = snapshot.get() // one read of one reference: always a whole, consistent snapshot
    cart.map(prices).sum

  def setPrices(changes: Map[String, Int]): Unit =
    snapshot.updateAndGet(old => old ++ changes) // retried if another writer won the race

@main def readWriteLockIdiomatic(): Unit =
  val catalog = PriceCatalog(Map("kurta" -> 1200, "saree" -> 3500, "dupatta" -> 600))
  val before = catalog.current
  catalog.setPrices(Map("kurta" -> 999, "dupatta" -> 499))

  println(s"Asha's cart now: ₹${catalog.quote(List("kurta", "dupatta"))}")
  println(s"A reader still holding the old snapshot sees: ₹${before("kurta") + before("dupatta")}")
  println(s"Old snapshot changed? ${before("kurta") != 1200}")
