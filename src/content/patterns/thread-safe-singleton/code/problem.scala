import java.util.concurrent.{CyclicBarrier, TimeUnit}
import java.util.concurrent.atomic.AtomicInteger

class DbPool private ():
  DbPool.created.incrementAndGet()
  val connections = 10 // imagine opening 10 real database connections here

object DbPool:
  val created = AtomicInteger(0)
  private var instance: DbPool = null

  def get(pause: Option[CyclicBarrier] = None): DbPool =
    if instance == null then // check ...
      pause.foreach(_.await(2, TimeUnit.SECONDS)) // demo only: a thread switch lands right here
      instance = new DbPool() // ... then act: both threads get here
    instance

@main def threadSafeSingletonProblem(): Unit =
  val race = CyclicBarrier(2)
  val threads = List.fill(2)(Thread(() => { DbPool.get(Some(race)); () }))
  threads.foreach(_.start())
  threads.foreach(_.join())

  println(s"Pools created: ${DbPool.created.get} (should be 1)")
  println(s"Connections opened: ${DbPool.created.get * 10}, and one pool is now lost but still open")
