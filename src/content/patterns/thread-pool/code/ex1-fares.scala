import java.util.concurrent.{Callable, Executors}
import scala.jdk.CollectionConverters.*

val CallMs = 20                                      // each airline API call waits ~20 ms (I/O)

val Airlines = List(                                 // made-up airlines and fares (rupees)
  "SkyJet" -> 4350, "BlueWing" -> 5120, "Kite Air" -> 4180,
  "Coastal" -> 4420, "Deccan Air" -> 5600, "Monsoon" -> 4260
)

def fetchFare(airline: String): (Int, String) =
  Thread.sleep(CallMs)                               // waiting on the network
  (Airlines.toMap.apply(airline), airline)

class FareSearch(workers: Int):
  def cheapest(): String =
    val pool = Executors.newFixedThreadPool(workers)
    val tasks = Airlines.map((name, _) => (() => fetchFare(name)): Callable[(Int, String)])
    val fares = pool.invokeAll(tasks.asJava).asScala.map(_.get())   // 6 tasks share the workers
    pool.shutdown()
    val (price, airline) = fares.min
    val rounds = math.ceil(Airlines.size.toDouble / workers).toInt   // calls each worker makes in turn
    f"cheapest $airline ₹$price%,d in ~${rounds * CallMs} ms"

@main def faresDemo(): Unit =
  for workers <- List(1, 2, 3, 6) do
    println(s"$workers worker(s): ${FareSearch(workers).cheapest()}")
