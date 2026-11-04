def loadLogo(carrier: String): Array[Byte] =
  Array.fill(2000)(carrier.getBytes).flatten // stands in for a heavy label logo (about 20 KB)

// every parcel carries its own copy of the carrier's logo and service text
class Parcel(val tracking: String, val weightKg: Double, val carrier: String, val service: String, val logo: Array[Byte]):
  def label: String = f"$tracking $weightKg%.1f kg via $carrier $service (logo ${logo.length} B)"

@main def demo(): Unit =
  // a busy depot handles 50,000 parcels a day, but only a handful of carrier styles
  val routes = List(("SwiftPost", "Express"), ("GreenFreight", "Economy"), ("SwiftPost", "Express"))
  val parcels = (routes ++ routes).zipWithIndex.map { case ((carrier, service), n) =>
    Parcel(f"TRK$n%04d", 1.0 + n % 7, carrier, service, loadLogo(carrier))
  }
  parcels.take(3).foreach(p => println(p.label))
  println(f"${parcels.size} parcels, total weight ${parcels.map(_.weightKg).sum}%.1f kg")
