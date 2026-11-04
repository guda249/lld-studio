import java.util.concurrent.{CyclicBarrier, TimeUnit}
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.locks.ReentrantReadWriteLock

// Many searches read cached fares; a miss asks the airline (slow) and fills the cache.
class FareCache(checkAgain: Boolean):
  private val rw = ReentrantReadWriteLock()
  private var fares = Map.empty[String, Int]
  val airlineCalls = AtomicInteger(0)

  def warmUp(route: String, fare: Int): Unit = fares = fares.updated(route, fare)

  def fare(route: String, sawMiss: CyclicBarrier): Int =
    rw.readLock().lock()
    val cached = try fares.get(route) finally rw.readLock().unlock()
    cached match
      case Some(f) => f
      case None =>
        sawMiss.await(2, TimeUnit.SECONDS) // demo only: now every search has seen the miss
        rw.writeLock().lock() // never lock() the write lock while holding the read lock: that deadlocks
        try
          fares.get(route) match
            case Some(f) if checkAgain => f // another search filled it while we waited
            case _ =>
              airlineCalls.incrementAndGet()
              fares = fares.updated(route, 5400) // stands in for the slow airline call
              5400
        finally rw.writeLock().unlock()

def run(searches: Int, warm: Boolean, checkAgain: Boolean): String =
  val cache = FareCache(checkAgain)
  if warm then cache.warmUp("BLR-DEL", 5400)
  val sawMiss = CyclicBarrier(searches)
  val threads = List.fill(searches)(Thread(() => { cache.fare("BLR-DEL", sawMiss); () }))
  threads.foreach(_.start())
  threads.foreach(_.join())
  val calls = cache.airlineCalls.get
  s"airline called $calls time${if calls == 1 then "" else "s"}"

@main def faresDemo(): Unit =
  for
    (label, searches, warm) <- List(("1 search", 1, false), ("4 searches", 4, false), ("4 searches, warm cache", 4, true))
    checkAgain <- List(true, false)
  do
    val rule = if checkAgain then "check again" else "no re-check"
    println(s"$label, $rule: ${run(searches, warm, checkAgain)}")
