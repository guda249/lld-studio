import scala.collection.mutable

trait MotionListener:                         // observer: anything that wants to hear about motion
  def onMotion(room: String): Unit

class MotionSensor(room: String):             // subject: knows a list, not who is on it
  private val listeners = mutable.ListBuffer.empty[MotionListener]

  def subscribe(listener: MotionListener): Unit = listeners += listener
  def unsubscribe(listener: MotionListener): Unit = listeners -= listener

  def detect(): Unit =
    println(s"Sensor: motion in the $room")
    for listener <- listeners do              // same message to everyone, no rules
      listener.onMotion(room)

class Light extends MotionListener:
  def onMotion(room: String): Unit = println(s"  Light: on in the $room")

class Alarm extends MotionListener:
  def onMotion(room: String): Unit = println(s"  Alarm: ringing, motion in the $room")

@main def demo(): Unit =
  val sensor = MotionSensor("hall")
  val light = Light()
  val alarm = Alarm()
  sensor.subscribe(light)
  sensor.subscribe(alarm)                     // we left home: the alarm listens too
  sensor.detect()
  sensor.unsubscribe(alarm)                   // back home: the alarm stops listening
  sensor.detect()
