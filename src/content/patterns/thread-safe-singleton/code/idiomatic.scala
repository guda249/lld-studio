import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.atomic.AtomicInteger
import scala.jdk.CollectionConverters.*

val created = AtomicInteger(0)

class DbPool:
  created.incrementAndGet()
  val connections = 10

// An object is created once, on first use; the JVM's class initialisation makes that thread-safe.
// This is the "lazy holder" idiom, built into the language.
object Db:
  val pool: DbPool = DbPool()

// A lazy val inside a class: computed on first access, exactly once, even when threads race.
class ReportService:
  lazy val pool: DbPool = DbPool()

@main def threadSafeSingletonIdiomatic(): Unit =
  val seen = ConcurrentLinkedQueue[DbPool]()
  val threads = List.fill(8)(Thread(() => { seen.add(Db.pool); () }))
  threads.foreach(_.start())
  threads.foreach(_.join())
  println(s"8 threads via object Db, distinct pools: ${seen.asScala.toList.distinct.size}")

  val reports = ReportService()
  val viaLazy = ConcurrentLinkedQueue[DbPool]()
  val more = List.fill(8)(Thread(() => { viaLazy.add(reports.pool); () }))
  more.foreach(_.start())
  more.foreach(_.join())
  println(s"8 threads via lazy val, distinct pools: ${viaLazy.asScala.toList.distinct.size}")
  println(s"Pools created in total: ${created.get}")
