class ZigbeeLight:
  def turnOn(room: String): String = s"[zigbee] light on in $room"

class ZigbeeLock:
  def lock(door: String): String = s"[zigbee] $door locked"

class WifiLight:
  def turnOn(room: String): String = s"[wifi] light on in $room"

class WifiLock:
  def lock(door: String): String = s"[wifi] $door locked"

// the protocol choice is repeated; a third protocol means editing every branch
class HomeHub(protocol: String):
  def evening(): List[String] =
    if protocol == "zigbee" then
      val light = ZigbeeLight()
      val lock = ZigbeeLock()
      List(light.turnOn("living room"), lock.lock("front door"))
    else
      val light = WifiLight()
      val lock = WifiLock()
      List(light.turnOn("living room"), lock.lock("front door"))

@main def demo(): Unit =
  for protocol <- List("zigbee", "wifi") do
    HomeHub(protocol).evening().foreach(println)
