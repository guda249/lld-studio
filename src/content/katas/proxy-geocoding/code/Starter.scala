import scala.collection.mutable

// Turns an address into map coordinates. Every call is a slow, paid-per-request web call.
class MapApiGeocoder:
  var calls = 0

  def lookup(address: String): (Double, Double) =
    calls += 1
    println(s"  (map API call for $address)")
    (address.length * 0.5, address.length * 0.25)

// One shared cache, but every caller must remember to check and fill it by hand.
val cache = mutable.Map.empty[String, (Double, Double)]

def planRoute(geo: MapApiGeocoder, start: String, end: String): String =
  if !cache.contains(start) then cache(start) = geo.lookup(start)
  if !cache.contains(end) then cache(end) = geo.lookup(end)
  s"route ${cache(start)} -> ${cache(end)}"

def dropPin(geo: MapApiGeocoder, address: String): String =
  if !cache.contains(address) then cache(address) = geo.lookup(address)
  s"pin at ${cache(address)}"

@main def demo(): Unit =
  val geo = MapApiGeocoder()
  println(planRoute(geo, "12 Oak St", "7 Elm Rd"))
  println(planRoute(geo, "12 Oak St", "3 Pine Ave"))
  println(dropPin(geo, "12 Oak St"))
  println(dropPin(geo, "12 Oak St"))
  println(s"API calls: ${geo.calls}")
