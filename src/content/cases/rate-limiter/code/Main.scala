import scala.collection.mutable

enum Algorithm(val label: String):
  case TokenBucket extends Algorithm("token bucket")
  case SlidingWindow extends Algorithm("sliding window")
  case FixedWindow extends Algorithm("fixed window")

/** At most `limit` requests per `window` seconds, for each client. */
case class Rule(limit: Int, window: Double, algorithm: Algorithm)

/** What the API sends back: 200 with a body, or 429 when the client is over its limit. */
case class Response(status: Int, body: String)

/** Strategy: every algorithm answers the same question the same way. */
trait RateLimiter:
  def allow(key: String, now: Double): Boolean

/** Each client has a bucket of `limit` tokens that refills smoothly over `window` seconds.
  * A quiet client earns its burst back; a busy one is held to the average rate.
  */
class TokenBucket(limit: Int, window: Double) extends RateLimiter:
  private val capacity = limit.toDouble
  private val rate = limit / window // tokens added per second
  private val buckets = mutable.Map.empty[String, (Double, Double)] // key -> (tokens, last time)

  def allow(key: String, now: Double): Boolean =
    val (saved, last) = buckets.getOrElse(key, (capacity, now))
    val tokens = math.min(capacity, saved + (now - last) * rate)
    val allowed = tokens >= 1.0
    buckets(key) = (if allowed then tokens - 1.0 else tokens, now)
    allowed

/** Remembers the time of each accepted request in the last `window` seconds.
  * Exact, but memory grows with the limit: one timestamp per accepted request.
  */
class SlidingWindowLog(limit: Int, window: Double) extends RateLimiter:
  private val log = mutable.Map.empty[String, mutable.Queue[Double]]

  def allow(key: String, now: Double): Boolean =
    val times = log.getOrElseUpdate(key, mutable.Queue.empty[Double])
    while times.nonEmpty && times.head <= now - window do
      times.dequeue() // forget requests that left the window
    if times.size < limit then
      times.enqueue(now)
      true
    else false

/** Counts requests per clock window (0-10 s, 10-20 s, ...). Cheap, but bursty at the edges. */
class FixedWindowCounter(limit: Int, window: Double) extends RateLimiter:
  private val counts = mutable.Map.empty[String, (Long, Int)] // key -> (window number, count)

  def allow(key: String, now: Double): Boolean =
    val current = math.floor(now / window).toLong
    val (windowNo, saved) = counts.getOrElse(key, (current, 0))
    val count = if windowNo != current then 0 else saved // a new window starts from zero
    val allowed = count < limit
    counts(key) = (current, if allowed then count + 1 else count)
    allowed

/** Turns a configuration Rule into the right algorithm, so callers never name a concrete class. */
class LimiterFactory:
  // the only place that maps an Algorithm to a concrete class
  def create(rule: Rule): RateLimiter = rule.algorithm match
    case Algorithm.TokenBucket => TokenBucket(rule.limit, rule.window)
    case Algorithm.SlidingWindow => SlidingWindowLog(rule.limit, rule.window)
    case Algorithm.FixedWindow => FixedWindowCounter(rule.limit, rule.window)

/** What callers of the order service see. The real service and the proxy both implement it. */
trait Api:
  def handle(clientId: String, now: Double): Response

/** The real service. It knows nothing about rate limits. */
class OrderApi extends Api:
  private var served = 0

  def handle(clientId: String, now: Double): Response =
    served += 1
    Response(200, s"order #$served for $clientId")

/** Proxy: same interface as the real Api; it checks the limiter before passing the call on. */
class RateLimitedApi(inner: Api, limiter: RateLimiter) extends Api:
  def handle(clientId: String, now: Double): Response =
    if !limiter.allow(clientId, now) then Response(429, "too many requests, try again later")
    else inner.handle(clientId, now)

/** Same requests, three algorithms: watch the fixed window let a burst through around t=10. */
def compareAlgorithms(factory: LimiterFactory): Unit =
  val times = List(0.0, 8.0, 9.0, 9.5, 10.0, 10.5, 11.0, 19.0)
  println(s"Rule: 3 requests per 10 s. Requests at ${times.mkString("[", ", ", "]")}")
  for algorithm <- Algorithm.values do
    val limiter = factory.create(Rule(3, 10.0, algorithm))
    val results = times.map(t => limiter.allow("alice", t))
    val marks = results.map(ok => if ok then "ok" else "--").mkString(" ")
    // how many got through in a 3-second stretch that crosses the window edge at t=10
    val burst = times.zip(results).count((t, ok) => ok && t >= 8.0 && t <= 11.0)
    println(f"  ${algorithm.label}%-15s $marks   ($burst allowed between t=8 and t=11)")

/** A token bucket lets a quiet client burst again, but only up to its capacity. */
def showRefill(factory: LimiterFactory): Unit =
  val limiter = factory.create(Rule(3, 3.0, Algorithm.TokenBucket)) // refills 1 token per second
  println("\nToken bucket, 3 per 3 s:")
  for now <- List(0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 9.0, 9.0, 9.0, 9.0) do
    val outcome = if limiter.allow("carol", now) then "allowed" else "rejected"
    println(f"  t=${now.toString}%-4s -> $outcome")

def serveThroughProxy(factory: LimiterFactory): Unit =
  val api = RateLimitedApi(OrderApi(), factory.create(Rule(2, 4.0, Algorithm.TokenBucket)))
  val calls = List(("alice", 0.0), ("alice", 0.5), ("alice", 1.0), ("bob", 1.0), ("alice", 3.0))
  println("\nOrder API behind a token bucket (2 per 4 s):")
  for (client, now) <- calls do
    val response = api.handle(client, now)
    println(f"  t=${now.toString}%-4s $client%-6s -> ${response.status} ${response.body}")

@main def demo(): Unit =
  val factory = LimiterFactory()
  compareAlgorithms(factory)
  showRefill(factory)
  serveThroughProxy(factory)
