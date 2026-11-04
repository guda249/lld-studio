import java.util.concurrent.{ConcurrentLinkedQueue, CyclicBarrier, TimeUnit}
import java.util.concurrent.atomic.AtomicInteger
import scala.jdk.CollectionConverters.*

// One counter per show. The object's creation is thread-safe; are its methods too?
object SeatCounter:
  @volatile private var last = 0
  private val atomicLast = AtomicInteger(0)

  def reset(): Unit = // demo only: start each run with an empty hall
    last = 0
    atomicLast.set(0)

  def nextSeatUnlocked(pause: CyclicBarrier): Int =
    val current = last // read ...
    pause.await(2, TimeUnit.SECONDS) // demo only: every booking reads before anyone writes
    last = current + 1 // ... then write: the other bookings' updates are lost
    current + 1

  def nextSeatLocked(pause: CyclicBarrier): Int =
    pause.await(2, TimeUnit.SECONDS)
    atomicLast.incrementAndGet() // read and write as one step

def run(locked: Boolean, bookings: Int): String =
  SeatCounter.reset()
  val pause = CyclicBarrier(bookings)
  val seats = ConcurrentLinkedQueue[Int]()
  val book: CyclicBarrier => Int = if locked then SeatCounter.nextSeatLocked else SeatCounter.nextSeatUnlocked
  val threads = List.fill(bookings)(Thread(() => { seats.add(book(pause)); () }))
  threads.foreach(_.start())
  threads.foreach(_.join())
  val distinct = seats.asScala.toList.distinct.sorted
  if distinct.size == bookings then s"$bookings bookings, seats 1 to ${distinct.max}"
  else if distinct.size == 1 then s"$bookings bookings, all got seat ${distinct.head}"
  else s"$bookings bookings, ${distinct.size} distinct seats"

@main def seatsDemo(): Unit =
  for locked <- List(false, true); bookings <- List(2, 4) do
    println(s"${if locked then "locked" else "unlocked"} nextSeat, ${run(locked, bookings)}")
  println(s"Same counter throughout: ${SeatCounter eq SeatCounter}")
