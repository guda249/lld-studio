import java.util.concurrent.atomic.AtomicLong

// One generator per JVM, so two parcels never get the same airway bill number.
// The object is created once; AtomicLong keeps nextAwb safe when many threads call it.
object AwbGenerator:
  private val counter = AtomicLong(0L)

  def nextAwb(hub: String): String = f"$hub-${counter.incrementAndGet()}%06d"

def hubWorker(hub: String): List[String] =
  (1 to 250).toList.map(_ => AwbGenerator.nextAwb(hub))

@main def awbDemo(): Unit =
  val hubs = List("BLR", "DEL", "BOM", "HYD")
  val issued = hubs.flatMap(hubWorker)
  println(s"Generated ${issued.size} AWB numbers, ${issued.distinct.size} unique")
  println(s"Next parcel from Chennai gets ${AwbGenerator.nextAwb("CHE")}")
  println(s"Same generator everywhere: ${AwbGenerator eq AwbGenerator}")
