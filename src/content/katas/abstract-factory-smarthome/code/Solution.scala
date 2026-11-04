trait Light:
  def turnOn(room: String): String

trait Lock:
  def lock(door: String): String

class ZigbeeLight extends Light:
  def turnOn(room: String): String = s"[zigbee] light on in $room"

class ZigbeeLock extends Lock:
  def lock(door: String): String = s"[zigbee] $door locked"

class WifiLight extends Light:
  def turnOn(room: String): String = s"[wifi] light on in $room"

class WifiLock extends Lock:
  def lock(door: String): String = s"[wifi] $door locked"

trait DeviceFactory:
  def createLight(): Light
  def createLock(): Lock

class ZigbeeFactory extends DeviceFactory:
  def createLight(): Light = ZigbeeLight()
  def createLock(): Lock = ZigbeeLock()

class WifiFactory extends DeviceFactory:
  def createLight(): Light = WifiLight()
  def createLock(): Lock = WifiLock()

class HomeHub(devices: DeviceFactory):
  def evening(): List[String] =
    val light = devices.createLight()
    val lock = devices.createLock()
    List(light.turnOn("living room"), lock.lock("front door"))

@main def demo(): Unit =
  val factories: List[DeviceFactory] = List(ZigbeeFactory(), WifiFactory())
  for factory <- factories do
    HomeHub(factory).evening().foreach(println)
