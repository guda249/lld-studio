import scala.collection.mutable

class Plane(val callSign: String, tower: Tower): // colleague: talks only to the tower
  def requestLanding(emergency: Boolean = false): Unit =
    println(s"$callSign: requesting landing${if emergency then " (low fuel!)" else ""}")
    tower.requestLanding(this, emergency)

  def vacateRunway(): Unit =
    println(s"$callSign: runway vacated")
    tower.runwayVacated(this)

  def receive(message: String): Unit = println(s"  tower -> $callSign: $message")

class Tower: // mediator: owns the one-runway rule and the landing queue
  private var onRunway: Option[Plane] = None
  private val waiting = mutable.ArrayDeque.empty[Plane]

  def requestLanding(plane: Plane, emergency: Boolean): Unit =
    if onRunway.isEmpty then clear(plane)
    else if emergency then
      waiting.prepend(plane) // jumps the queue
      plane.receive("priority granted, you are next")
    else
      waiting.append(plane)
      plane.receive(s"hold, number ${waiting.size} in queue")

  def runwayVacated(plane: Plane): Unit =
    if onRunway.contains(plane) then
      onRunway = None
      if waiting.nonEmpty then clear(waiting.removeHead())

  private def clear(plane: Plane): Unit =
    onRunway = Some(plane)
    plane.receive("cleared to land, runway 27")

@main def atcDemo(): Unit =
  val tower = Tower()
  val airIndia = Plane("AI101", tower)
  val indigo = Plane("6E202", tower)
  val vistara = Plane("UK303", tower)
  val spicejet = Plane("SG404", tower)
  airIndia.requestLanding()
  indigo.requestLanding()
  vistara.requestLanding()
  spicejet.requestLanding(emergency = true)
  airIndia.vacateRunway()
  spicejet.vacateRunway()
