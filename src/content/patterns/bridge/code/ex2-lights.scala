trait Bulb: // implementation side: how a bulb is actually told what to do
  def setLevel(percent: Int): String

class WifiBulb(val ip: String) extends Bulb:
  def setLevel(percent: Int): String = s"HTTP PUT $ip/level=$percent"

class ZigbeeBulb(val address: Int) extends Bulb:
  def setLevel(percent: Int): String =
    val raw = percent * 255 / 100
    f"Zigbee frame 0x$address%04X:$raw%02X"

abstract class Switch(var bulb: Bulb): // abstraction side; bulb is the bridge, swappable at runtime
  var level: Int = 0
  def label: String
  def nextLevel(): Int

  def press(): String =
    level = nextLevel()
    f"$label%-6s -> $level%3d%%  ${bulb.setLevel(level)}"

class ToggleSwitch(b: Bulb) extends Switch(b):
  val label: String = "Toggle"
  def nextLevel(): Int = if level > 0 then 0 else 100

class DimmerSwitch(b: Bulb) extends Switch(b):
  val label: String = "Dimmer"
  private val steps = List(0, 30, 70, 100)
  def nextLevel(): Int = steps((steps.indexOf(level) + 1) % steps.size)

@main def lightsBridgeDemo(): Unit =
  val hall = ToggleSwitch(WifiBulb("192.168.1.20"))
  println(hall.press())
  println(hall.press())

  val bedroom = DimmerSwitch(ZigbeeBulb(0x1A2B))
  for _ <- 1 to 3 do println(bedroom.press())

  bedroom.bulb = WifiBulb("192.168.1.31") // replaced the bulb; the switch logic is untouched
  println(bedroom.press())
