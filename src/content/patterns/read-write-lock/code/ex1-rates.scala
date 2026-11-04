import java.util.concurrent.{CountDownLatch, TimeUnit}
import java.util.concurrent.locks.ReentrantReadWriteLock

// Foreign-exchange rates read by every payment, updated by one rate feed.
class RateBoard:
  val lock = ReentrantReadWriteLock()
  var rates: Map[String, Double] = Map("USD" -> 83.2, "EUR" -> 90.1)

def holder(lock: ReentrantReadWriteLock, kind: String, leave: CountDownLatch): Thread =
  val l = if kind == "read" then lock.readLock() else lock.writeLock()
  Thread(() =>
    l.lock()
    try leave.await()
    finally l.unlock()
  )

// Tries to get in without waiting and says what happened. tryLock(0, ...) respects a queued
// writer; the no-argument tryLock() on a read lock would barge past it.
def arrive(lock: ReentrantReadWriteLock, who: String): String =
  val l = if who == "payment" then lock.readLock() else lock.writeLock()
  if l.tryLock(0, TimeUnit.MILLISECONDS) then
    val message = if who == "payment" then s"enters at once (${lock.getReadLockCount} reading)" else "enters alone"
    l.unlock()
    message
  else if lock.isWriteLocked then "waits for the writer to finish"
  else if lock.hasQueuedThreads then
    if who == "payment" then "waits: a writer is queued first" else "waits behind the queued writer"
  else s"waits for ${lock.getReadLockCount} readers to leave"

def inside(lock: ReentrantReadWriteLock): Int =
  lock.getReadLockCount + (if lock.isWriteLocked then 1 else 0) + lock.getQueueLength

@main def ratesDemo(): Unit =
  val states = List("nobody inside" -> List(), "2 readers inside" -> List("read", "read"),
    "writer inside" -> List("write"), "writer queued" -> List("read", "read", "write"))
  for (state, kinds) <- states; who <- List("payment", "rate feed") do
    val board = RateBoard()
    val leave = CountDownLatch(1)
    val threads = kinds.map(k => holder(board.lock, k, leave))
    for (t, count) <- threads.zip(1 to threads.size) do
      t.start()
      while inside(board.lock) < count do Thread.sleep(1) // wait until this holder is inside (or queued)
    println(f"$state%16s + $who%-9s -> ${arrive(board.lock, who)}")
    leave.countDown()
    threads.foreach(_.join())
