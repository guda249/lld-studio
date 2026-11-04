import java.util.concurrent.{ConcurrentHashMap, ConcurrentLinkedQueue, CyclicBarrier, TimeUnit}
import java.util.concurrent.locks.ReentrantReadWriteLock
import scala.jdk.CollectionConverters.*

// ReentrantReadWriteLock: many readers at once, or one writer alone.
class PriceCatalog(initial: Map[String, Int]):
  private val rw = ReentrantReadWriteLock()
  private var prices = initial
  val seenInside = ConcurrentLinkedQueue[Int]()

  def quote(cart: List[String], slowPart: () => Unit): Int =
    rw.readLock().lock() // shared: other readers may be inside too
    try
      seenInside.add(rw.getReadLockCount)
      slowPart() // stands in for slow work done while reading
      cart.map(prices).sum
    finally rw.readLock().unlock()

  def setPrice(sku: String, price: Int): Int =
    rw.writeLock().lock() // exclusive: no reader and no other writer inside
    try
      prices = prices.updated(sku, price)
      rw.getReadLockCount
    finally rw.writeLock().unlock()

@main def readWriteLockDemo(): Unit =
  val catalog = PriceCatalog(Map("kurta" -> 1200, "saree" -> 3500, "dupatta" -> 600))
  val carts = Map("Asha" -> List("kurta", "dupatta"), "Ravi" -> List("saree"), "Meera" -> List("kurta"), "Vikram" -> List("saree", "kurta"))
  val allInside = CyclicBarrier(carts.size) // returns only when all four are inside together
  def waitForAll(): Unit = allInside.await(2, TimeUnit.SECONDS)
  val quotes = ConcurrentHashMap[String, Int]()
  val shoppers = carts.toList.map((name, cart) => Thread(() => { quotes.put(name, catalog.quote(cart, () => waitForAll())); () }))
  shoppers.foreach(_.start())
  shoppers.foreach(_.join())

  println("Quotes: " + quotes.asScala.toList.sorted.map((n, q) => s"$n ₹$q").mkString(", "))
  println(s"Peak readers inside at once: ${catalog.seenInside.asScala.max}")
  println(s"Sale job wrote kurta = ₹999 with ${catalog.setPrice("kurta", 999)} readers inside")
  println(s"Asha's cart after the sale: ₹${catalog.quote(carts("Asha"), () => ())}")
