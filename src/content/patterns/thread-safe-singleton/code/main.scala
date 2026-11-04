import java.util.concurrent.{ConcurrentLinkedQueue, CyclicBarrier, TimeUnit}
import java.util.concurrent.atomic.AtomicInteger
import scala.jdk.CollectionConverters.*

class DbPool private ():
  DbPool.created.incrementAndGet()
  val connections = 10 // imagine opening 10 real database connections here

object DbPool:
  val created = AtomicInteger(0)
  @volatile private var instance: DbPool = null // volatile: no thread sees a half-built pool
  private val lock = new Object

  def get(pause: Option[CyclicBarrier] = None): DbPool =
    if instance == null then // 1st check, no lock: the fast path once it exists
      pause.foreach(_.await(2, TimeUnit.SECONDS)) // demo only: both threads pass the 1st check together
      lock.synchronized: // one thread at a time from here
        if instance == null then // 2nd check: did someone create it while we waited?
          instance = new DbPool()
    instance

@main def threadSafeSingletonDemo(): Unit =
  val race = CyclicBarrier(2)
  val pools = ConcurrentLinkedQueue[DbPool]()
  val threads = List.fill(2)(Thread(() => { pools.add(DbPool.get(Some(race))); () }))
  threads.foreach(_.start())
  threads.foreach(_.join())

  val got = pools.asScala.toList
  println(s"Two threads raced past the 1st check; pools created: ${DbPool.created.get}")
  println(s"Both threads got the same pool: ${got(0) eq got(1)}")
  val later = List.fill(1000)(DbPool.get())
  println(s"1000 later calls, no lock, same pool: ${later.forall(_ eq got(0))}")
  println(s"Connections open: ${got(0).connections}")
