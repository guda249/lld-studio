trait Geocoder: // target: what our code wants
  def locate(address: String): (Double, Double)

// third-party library: we can't change it. Coordinates come back in millionths of a degree.
class GeoCodeApi:
  private val places = Map("12 Baker St" -> (51523767, -158553), "1 Main Rd" -> (51507351, -127758))

  def geocode(query: String): Map[String, Int] =
    val (lat, lng) = places(query)
    Map("lat_e6" -> lat, "lng_e6" -> lng)

class GeoCodeApiAdapter(api: GeoCodeApi) extends Geocoder: // adapter: the only place that knows the units
  def locate(address: String): (Double, Double) =
    val raw = api.geocode(address)
    (raw("lat_e6") / 1000000.0, raw("lng_e6") / 1000000.0)

class StoreFinder(geocoder: Geocoder):
  def nearestTo(address: String): String =
    val (lat, lng) = geocoder.locate(address)
    val store = if lat > 51.515 then "North store" else "South store"
    f"$address ($lat%.4f, $lng%.4f) -> $store"

class DeliveryZone(geocoder: Geocoder):
  def isCovered(address: String): String =
    val (_, lng) = geocoder.locate(address)
    s"$address delivery: ${if lng > -0.15 then "yes" else "no"}"

@main def demo(): Unit =
  val geocoder = GeoCodeApiAdapter(GeoCodeApi())
  val finder = StoreFinder(geocoder)
  val zone = DeliveryZone(geocoder)
  val addresses = List("12 Baker St", "1 Main Rd")
  addresses.foreach(a => println(finder.nearestTo(a)))
  addresses.foreach(a => println(zone.isCovered(a)))
