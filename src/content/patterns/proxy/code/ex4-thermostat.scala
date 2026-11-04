trait Thermostat:
  def setTarget(celsius: Int): String
  def reading(): String

// Runs on the device itself, in another building.
class DeviceThermostat extends Thermostat:
  private var target = 26
  def setTarget(celsius: Int): String =
    target = celsius
    s"target ${celsius}°C"
  def reading(): String = s"room 29°C, target ${target}°C"

// The device side: turns a text message back into a method call.
def deviceServer(device: DeviceThermostat): String => String = message =>
  message.split(":", 2).toList match
    case List("SET", arg) => device.setTarget(arg.toInt)
    case _ => device.reading()

// Remote proxy: looks local, but every call becomes a network message.
class ThermostatProxy(send: String => String) extends Thermostat:
  private def call(message: String): String =
    println(s"  -> wire: $message")
    send(message)

  def setTarget(celsius: Int): String = call(s"SET:$celsius")
  def reading(): String = call("GET")

@main def remoteThermostat(): Unit =
  val network = deviceServer(DeviceThermostat()) // stands in for MQTT or HTTP
  val thermostat: Thermostat = ThermostatProxy(network)
  println(thermostat.reading())
  println(thermostat.setTarget(22))
  println(thermostat.reading())
