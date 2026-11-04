import scala.collection.concurrent.TrieMap

// Flyweight: intrinsic, shared and immutable (imagine a 50 KB bitmap here).
final case class MarkerStyle(icon: String, color: String)

object MarkerStyleFactory:
  private val styles = TrieMap.empty[(String, String), MarkerStyle] // thread-safe cache

  def get(icon: String, color: String): MarkerStyle =
    styles.getOrElseUpdate((icon, color), MarkerStyle(icon, color))

  def count: Int = styles.size

// Context: extrinsic state, unique to each car, plus a shared style.
final case class Marker(lat: Double, lng: Double, style: MarkerStyle):
  def draw(): String = f"${style.icon} (${style.color}) at $lat%.4f,$lng%.4f"

@main def flyweightDemo(): Unit =
  val cars = (0 until 100000).map(i =>
    Marker(17.38 + i * 1e-4, 78.48, MarkerStyleFactory.get("car.png", "yellow")))
  val markers = cars :+ Marker(17.44, 78.35, MarkerStyleFactory.get("bike.png", "green"))
  println(s"${markers.size} markers share ${MarkerStyleFactory.count} styles")
  println(markers.head.draw())
  println(markers.last.draw())
  println(s"same style object: ${markers(0).style eq markers(99999).style}")
