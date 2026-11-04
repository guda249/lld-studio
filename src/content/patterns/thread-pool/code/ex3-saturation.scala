import java.util.concurrent.{ArrayBlockingQueue, Callable, CountDownLatch, Future, RejectedExecutionException, ThreadPoolExecutor, TimeUnit}

// Executors.newFixedThreadPool has an unbounded waiting queue. At the dinner peak that
// means thousands of pushes pile up in memory. A bounded pool takes at most
// workers + queueSize tasks and rejects the rest at once, so the caller can retry later.
class BoundedPool(workers: Int, queueSize: Int):
  private val pool = ThreadPoolExecutor(
    workers, workers, 0L, TimeUnit.SECONDS,
    ArrayBlockingQueue[Runnable](queueSize),         // bounded waiting room
    ThreadPoolExecutor.AbortPolicy()                 // full: throw instead of piling up
  )

  def trySubmit(task: () => String): Option[Future[String]] =
    val job: Callable[String] = () => task()
    try Some(pool.submit(job))
    catch case _: RejectedExecutionException => None

  def shutdown(): Unit =
    pool.shutdown()
    pool.awaitTermination(2, TimeUnit.SECONDS)

def dinnerPeak(workers: Int, queueSize: Int): String =
  val gate = CountDownLatch(1)                       // holds every push until all 10 are offered
  def push(order: Int): String =
    gate.await()
    s"pushed #$order"

  val pool = BoundedPool(workers, queueSize)
  val accepted = (1 to 10).flatMap(n => pool.trySubmit(() => push(n)))
  gate.countDown()                                   // the slow push service answers
  pool.shutdown()
  val sent = accepted.count(_.get().startsWith("pushed"))
  s"$sent sent, ${10 - accepted.size} rejected"

@main def saturationDemo(): Unit =
  for workers <- List(2, 4); queueSize <- List(2, 4) do
    println(s"$workers workers, queue $queueSize: ${dinnerPeak(workers, queueSize)}")
