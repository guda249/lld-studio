import scala.collection.mutable

final case class MarkerStyle(icon: String, color: String)

// A memoised factory: the cache inside the object IS the flyweight factory.
object Styles:
  private val cache = mutable.Map.empty[(String, String), MarkerStyle]
  def style(icon: String, color: String): MarkerStyle =
    cache.getOrElseUpdate((icon, color), MarkerStyle(icon, color))
  def size: Int = cache.size

final case class Marker(lat: Double, lng: Double, style: MarkerStyle)

@main def flyweightIdiomatic(): Unit =
  val markers = (0 until 50000).map(i => Marker(12.97 + i * 1e-4, 77.59, Styles.style("auto.png", "green")))
  println(s"${markers.size} markers, ${Styles.size} style object")
  println(s"shared: ${markers.head.style eq markers.last.style}")
