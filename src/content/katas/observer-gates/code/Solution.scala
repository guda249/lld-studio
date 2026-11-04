import scala.collection.mutable.ListBuffer

trait GateListener:
  def gateChanged(flight: String, gate: String): Unit

class GateScreen extends GateListener:
  def gateChanged(flight: String, gate: String): Unit =
    println(s"[screen] $flight now boards at gate $gate")

class SmsService extends GateListener:
  def gateChanged(flight: String, gate: String): Unit =
    println(s"[sms] Your flight $flight moved to gate $gate")

class Flight(val code: String, var gate: String):
  private val listeners = ListBuffer.empty[GateListener]

  def subscribe(listener: GateListener): Unit = listeners += listener
  def unsubscribe(listener: GateListener): Unit = listeners -= listener

  def changeGate(newGate: String): Unit =
    gate = newGate
    notifyListeners()

  private def notifyListeners(): Unit =
    listeners.toList.foreach(_.gateChanged(code, gate))

@main def demo(): Unit =
  val flight = Flight("LX318", "A4")
  flight.subscribe(GateScreen())
  flight.subscribe(SmsService())
  flight.changeGate("B12")
  flight.changeGate("B14")
