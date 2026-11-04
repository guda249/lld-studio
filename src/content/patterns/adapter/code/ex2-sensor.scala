trait TemperatureSensor: // target: the cold-chain dashboard works in Celsius
  def sensorId: String
  def celsius: Double

class LegacyFahrenheitProbe(val serial: String, readingF: Double): // adaptee: imported firmware
  def readF(): Double = readingF

// Class adapter: inherits the probe and mixes in the target trait.
class ProbeAdapter(probeSerial: String, f: Double) extends LegacyFahrenheitProbe(probeSerial, f) with TemperatureSensor:
  def sensorId: String = s"probe-$serial"
  def celsius: Double = math.round((readF() - 32) * 5 / 9 * 10) / 10.0

class NativeSensor(val sensorId: String, val celsius: Double) extends TemperatureSensor // already fits

def checkColdRoom(sensors: List[TemperatureSensor], maxC: Double): Unit =
  for s <- sensors do
    val status = if s.celsius <= maxC then "OK" else "ALERT"
    println(f"${s.sensorId}%-12s ${s.celsius}%5.1f °C  $status")

@main def sensorAdapterDemo(): Unit =
  val oldProbe = ProbeAdapter("F207", 46.4)
  val vaccineRoom = List(NativeSensor("rack-A", 3.5), ProbeAdapter("F102", 39.2), oldProbe)
  checkColdRoom(vaccineRoom, maxC = 5.0)
  println(s"Adapter is still a probe too: raw reading ${oldProbe.readF()} °F")
