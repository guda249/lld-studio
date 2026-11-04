import java.util.concurrent.{CompletableFuture, ExecutionException, LinkedBlockingQueue}

class ThreadPool(val size: Int):
  private val tasks = LinkedBlockingQueue[Option[() => Unit]]()   // submitted tasks wait here
  private val workers = List.fill(size)(Thread(() => work()))
  workers.foreach(_.start())                         // threads are created once, here

  def submit[T](task: () => T): CompletableFuture[T] =
    val future = CompletableFuture[T]()
    val job: () => Unit = () =>
      try future.complete(task())
      catch case e: Exception => future.completeExceptionally(e)   // errors travel back too
    tasks.put(Some(job))                             // the task waits for a free worker
    future                                           // the caller gets a handle at once

  private def work(): Unit =
    var running = true
    while running do
      tasks.take() match
        case Some(run) => run()                      // the same thread runs task after task
        case None => running = false

  def shutdown(): Unit =
    workers.foreach(_ => tasks.put(None))            // one stop signal per worker
    workers.foreach(_.join())

def makeInvoice(orderId: Int): String =
  if orderId == 7 then throw IllegalArgumentException("order 7 has no address")
  s"invoice-$orderId.pdf"

@main def threadPoolDemo(): Unit =
  val pool = ThreadPool(3)
  val futures = (1 to 10).map(id => pool.submit(() => makeInvoice(id)))
  pool.shutdown()

  val ok = futures.filterNot(_.isCompletedExceptionally).map(_.get())
  val failed =
    try futures(6).get() catch case e: ExecutionException => e.getCause.getMessage
  println(s"10 orders -> threads created: ${pool.size}")
  println(s"First three: ${ok.take(3).toList}")
  println(s"Order 7 failed: $failed")
  println(s"Invoices ready: ${ok.size}")
