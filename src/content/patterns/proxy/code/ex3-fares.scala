import scala.collection.mutable

trait FareService:
  def fare(route: String, now: Int): Int

// The real API: slow, and the airline bills us per call.
class AirlineFareApi extends FareService:
  var calls = 0
  def fare(route: String, now: Int): Int =
    calls += 1
    val base = Map("BLR-DEL" -> 5400, "BOM-GOI" -> 2900)(route)
    base + 100 * (now / 300)                     // prices drift every 5 minutes

// Caching proxy: answers repeat questions for `ttl` seconds without calling the API.
class CachedFareService(real: FareService, ttl: Int) extends FareService:
  private val cache = mutable.Map.empty[String, (Int, Int)] // route -> (fare, fetchedAt)

  def fare(route: String, now: Int): Int =
    cache.get(route) match
      case Some((value, fetchedAt)) if now - fetchedAt < ttl => value
      case _ =>
        val value = real.fare(route, now)
        cache(route) = (value, now)
        value

@main def fareCache(): Unit =
  val api = AirlineFareApi()
  val fares: FareService = CachedFareService(api, ttl = 120)
  val searches = List((0, "BLR-DEL"), (30, "BLR-DEL"), (45, "BOM-GOI"), (90, "BLR-DEL"), (400, "BLR-DEL"))
  for (now, route) <- searches do                 // (seconds on a fake clock, route)
    println(f"t=$now%3ds $route ₹${fares.fare(route, now)}%,d")
  println(s"${searches.size} searches, ${api.calls} paid API calls")
