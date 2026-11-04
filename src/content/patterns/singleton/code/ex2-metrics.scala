import scala.collection.mutable

// One Counter per metric name (a "multiton"), like logging.getLogger(name).
class Counter private (val name: String):
  private var count: Int = 0
  def inc(by: Int = 1): Unit = count += by
  def value: Int = count

object Counter:
  private val registry = mutable.LinkedHashMap.empty[String, Counter]

  def named(name: String): Counter = registry.getOrElseUpdate(name, new Counter(name))

  def report(): String = registry.toList.map((name, c) => s"$name=${c.value}").mkString(", ")

// Two "modules" that never import each other still update the same counters.
def handleLogin(ok: Boolean): Unit =
  Counter.named("http_requests").inc()
  if !ok then Counter.named("login_failures").inc()

def handleSearch(results: Int): Unit =
  Counter.named("http_requests").inc()
  Counter.named("search_results").inc(results)

@main def metricsDemo(): Unit =
  handleLogin(true)
  handleLogin(false)
  handleSearch(12)
  handleSearch(0)
  println(s"Same counter object: ${Counter.named("http_requests") eq Counter.named("http_requests")}")
  println(s"Metrics: ${Counter.report()}")
