trait HomeHub:                                // mediator: devices only know this
  def onEvent(sender: Device, event: String): Unit

class Device(val hub: HomeHub)                // colleague base: one link, to the hub

class MotionSensor(h: HomeHub) extends Device(h):
  def detect(): Unit =
    println("Sensor: motion in the hall")
    hub.onEvent(this, "motion")

class Light(h: HomeHub) extends Device(h):
  def turnOn(why: String): Unit = println(s"  Light: on ($why)")

class Alarm(h: HomeHub) extends Device(h):
  def ring(): Unit =
    println("  Alarm: ringing")
    hub.onEvent(this, "alarm")                // the alarm doesn't know the light exists

class SmartHome extends HomeHub:              // concrete mediator: ALL the rules live here
  var away = false
  val sensor = MotionSensor(this)
  val light = Light(this)
  val alarm = Alarm(this)

  def onEvent(sender: Device, event: String): Unit =
    if event == "motion" && away then alarm.ring()
    else if event == "motion" then light.turnOn("someone is home")
    else if event == "alarm" then light.turnOn("flashing for the alarm")

@main def demo(): Unit =
  val home = SmartHome()
  home.sensor.detect()                        // at home: just the light
  home.away = true
  home.sensor.detect()                        // away: alarm, and the alarm asks for the light
