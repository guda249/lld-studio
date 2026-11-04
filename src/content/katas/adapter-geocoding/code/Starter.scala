// third-party library: we can't change it. Coordinates come back in millionths of a degree.
class GeoCodeApi:
  private val places = Map("12 Baker St" -> (51523767, -158553), "1 Main Rd" -> (51507351, -127758))

  def geocode(query: String): Map[String, Int] =
    val (lat, lng) = places(query)
    Map("lat_e6" -> lat, "lng_e6" -> lng)

class StoreFinder(api: GeoCodeApi):
  def nearestTo(address: String): String =
    val raw = api.geocode(address) // knows the vendor's units
    val lat = raw("lat_e6") / 1000000.0
    val lng = raw("lng_e6") / 1000000.0
    val store = if lat > 51.515 then "North store" else "South store"
    f"$address ($lat%.4f, $lng%.4f) -> $store"

class DeliveryZone(api: GeoCodeApi):
  def isCovered(address: String): String =
    val raw = api.geocode(address) // and again, converted by hand
    val lng = raw("lng_e6") / 1000000.0
    s"$address delivery: ${if lng > -0.15 then "yes" else "no"}"

@main def demo(): Unit =
  val api = GeoCodeApi()
  val finder = StoreFinder(api)
  val zone = DeliveryZone(api)
  val addresses = List("12 Baker St", "1 Main Rd")
  addresses.foreach(a => println(finder.nearestTo(a)))
  addresses.foreach(a => println(zone.isCovered(a)))
