import scala.collection.mutable

def loadLogo(carrier: String): Array[Byte] =
  Array.fill(2000)(carrier.getBytes).flatten // stands in for a heavy label logo (about 20 KB)

// flyweight: shared, never changes
final case class CarrierStyle(carrier: String, service: String, logo: Array[Byte])

// factory: one CarrierStyle per (carrier, service)
class CarrierCatalog:
  private val styles = mutable.Map.empty[(String, String), CarrierStyle]

  def style(carrier: String, service: String): CarrierStyle =
    styles.getOrElseUpdate((carrier, service), CarrierStyle(carrier, service, loadLogo(carrier)))

// context: only what is unique to this parcel
class Parcel(val tracking: String, val weightKg: Double, val style: CarrierStyle):
  def label: String =
    f"$tracking $weightKg%.1f kg via ${style.carrier} ${style.service} (logo ${style.logo.length} B)"

@main def demo(): Unit =
  val catalog = CarrierCatalog()
  val routes = List(("SwiftPost", "Express"), ("GreenFreight", "Economy"), ("SwiftPost", "Express"))
  val parcels = (routes ++ routes).zipWithIndex.map { case ((carrier, service), n) =>
    Parcel(f"TRK$n%04d", 1.0 + n % 7, catalog.style(carrier, service))
  }
  parcels.take(3).foreach(p => println(p.label))
  println(f"${parcels.size} parcels, total weight ${parcels.map(_.weightKg).sum}%.1f kg")
