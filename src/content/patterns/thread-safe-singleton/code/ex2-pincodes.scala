import java.util.concurrent.ConcurrentLinkedQueue
import scala.jdk.CollectionConverters.*

val log = ConcurrentLinkedQueue[String]()

// 19,000 pincodes and their cities: slow to build, then read-only.
class PincodeDirectory:
  log.add("load")
  private val cities = Map("560001" -> "Bengaluru", "110001" -> "New Delhi")
  def city(pincode: String): String = cities(pincode)

trait Services:
  def directory: PincodeDirectory

class EagerServices extends Services:
  val directory: PincodeDirectory = PincodeDirectory() // built at startup, whether or not anyone needs it

class LazyServices extends Services:
  lazy val directory: PincodeDirectory = PincodeDirectory() // built on first use, exactly once, thread-safe

def run(make: () => Services, used: Boolean): String =
  log.clear()
  val services = make()
  log.add("ready")
  if used then
    val threads = List.fill(4)(Thread(() => { services.directory.city("560001"); () }))
    threads.foreach(_.start())
    threads.foreach(_.join())
  val events = log.asScala.toList
  val loads = events.count(_ == "load")
  if loads == 0 then "never loaded"
  else
    val when = if events.indexOf("load") < events.indexOf("ready") then "at startup" else "on first use"
    s"loaded $when, $loads time" + (if used then "" else ", never used")

@main def pincodesDemo(): Unit =
  val kinds = List[(String, () => Services)](("eager", () => EagerServices()), ("lazy", () => LazyServices()))
  for
    (name, make) <- kinds
    used <- List(true, false)
  do
    val label = if used then "4 parcels routed" else "no parcels today"
    println(s"$name, $label: ${run(make, used)}")
