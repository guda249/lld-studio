import java.util.concurrent.{Callable, CyclicBarrier, ExecutorService, Executors, TimeUnit, TimeoutException}

// Pool starvation: a task that waits for another task submitted to the SAME pool.
// If every worker is busy waiting, the inner tasks sit in the queue with no worker
// left to run them. Without a timeout the program would hang forever.
def checkStock(item: String): Boolean = true         // quick inner task

class OrderService(workers: Int, separateStockPool: Boolean):
  val orders: ExecutorService = Executors.newFixedThreadPool(workers)
  val stock: ExecutorService = if separateStockPool then Executors.newFixedThreadPool(2) else orders
  private val rush = CyclicBarrier(2)                // demo only: both orders start and end together

  def confirm(item: String): String =                // runs on an order worker
    rush.await()
    val job: Callable[Boolean] = () => checkStock(item)
    val check = stock.submit(job)
    val result =
      try if check.get(50, TimeUnit.MILLISECONDS) then "confirmed" else "out of stock"
      catch case _: TimeoutException => "timed out"  // no free worker ever ran checkStock
    rush.await()                                     // keep both workers busy until both orders are done
    result

  def run(items: List[String]): String =
    val futures = items.map { item =>
      val job: Callable[String] = () => confirm(item)
      orders.submit(job)
    }
    val results = futures.map(_.get())
    orders.shutdown()
    stock.shutdown()
    s"${results.count(_ == "confirmed")} confirmed, ${results.count(_ == "timed out")} timed out"

@main def starvationDemo(): Unit =
  for separate <- List(false, true); workers <- List(2, 3) do
    val design = if separate then "separate stock pool" else "same pool"
    println(s"$design, $workers workers: ${OrderService(workers, separate).run(List("kurta", "saree"))}")
