class GateScreen:
  def show(flight: String, gate: String): Unit =
    println(s"[screen] $flight now boards at gate $gate")

class SmsService:
  def textPassengers(flight: String, gate: String): Unit =
    println(s"[sms] Your flight $flight moved to gate $gate")

class Flight(val code: String, var gate: String):
  // The flight creates and calls every consumer itself.
  private val screen = GateScreen()
  private val sms = SmsService()

  def changeGate(newGate: String): Unit =
    gate = newGate
    screen.show(code, newGate)
    sms.textPassengers(code, newGate)

@main def demo(): Unit =
  val flight = Flight("LX318", "A4")
  flight.changeGate("B12")
  flight.changeGate("B14")
