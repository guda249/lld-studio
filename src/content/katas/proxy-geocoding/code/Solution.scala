import scala.collection.mutable

trait Geocoder:
  def lookup(address: String): (Double, Double)

// Turns an address into map coordinates. Every call is a slow, paid-per-request web call.
class MapApiGeocoder extends Geocoder:
  var calls = 0

  def lookup(address: String): (Double, Double) =
    calls += 1
    println(s"  (map API call for $address)")
    (address.length * 0.5, address.length * 0.25)

// Caching proxy: same interface, answers repeat questions itself, asks the real API only once per address.
class CachingGeocoder(real: Geocoder) extends Geocoder:
  private val cache = mutable.Map.empty[String, (Double, Double)]

  def lookup(address: String): (Double, Double) =
    cache.getOrElseUpdate(address, real.lookup(address))

def planRoute(geo: Geocoder, start: String, end: String): String =
  s"route ${geo.lookup(start)} -> ${geo.lookup(end)}"

def dropPin(geo: Geocoder, address: String): String =
  s"pin at ${geo.lookup(address)}"

@main def demo(): Unit =
  val api = MapApiGeocoder()
  val geo: Geocoder = CachingGeocoder(api)
  println(planRoute(geo, "12 Oak St", "7 Elm Rd"))
  println(planRoute(geo, "12 Oak St", "3 Pine Ave"))
  println(dropPin(geo, "12 Oak St"))
  println(dropPin(geo, "12 Oak St"))
  println(s"API calls: ${api.calls}")
