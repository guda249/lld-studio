import java.util.concurrent.{ArrayBlockingQueue, Executors}
import scala.concurrent.{Await, ExecutionContext, Future}
import scala.concurrent.duration.*

// Consumers run as Futures and each returns its own list, so nothing is shared
// except the queue. Option marks the end: None is the poison pill.
@main def idiomaticDemo(): Unit =
  val pool = Executors.newFixedThreadPool(3)         // 2 consumers + 1 producer
  given ExecutionContext = ExecutionContext.fromExecutorService(pool)
  val jobs = ArrayBlockingQueue[Option[String]](3)

  def consume(): Future[List[String]] = Future {
    Iterator.continually(jobs.take()).takeWhile(_.isDefined).map(p => s"thumb(${p.get})").toList
  }

  val consumers = List.fill(2)(consume())
  Future {
    for n <- 1 to 8 do jobs.put(Some(s"img$n.jpg"))
    consumers.foreach(_ => jobs.put(None))
  }

  val done = Await.result(Future.sequence(consumers), 2.seconds).flatten
  pool.shutdown()
  println(s"Thumbnails made: ${done.size}")
  println(s"First three: ${done.sorted.take(3)}")
