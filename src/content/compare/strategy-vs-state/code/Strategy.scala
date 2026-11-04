trait Speed:                                  // strategy: one way to run the fan
  def rpm: Int

class Low extends Speed:
  def rpm: Int = 600

class High extends Speed:
  def rpm: Int = 1200

class Fan(private var speed: Speed):          // context: the client hands it a speed

  def setSpeed(s: Speed): Unit =              // the CLIENT decides when to switch
    speed = s

  def run(): String = s"Fan at ${speed.rpm} rpm"

@main def demo(): Unit =
  val fan = Fan(Low())
  println(fan.run())
  fan.setSpeed(High())                        // the remote control picks a new speed
  println(fan.run())
  fan.setSpeed(High())                        // picking the same one again changes nothing
  println(fan.run())
  fan.setSpeed(Low())                         // any order the client likes: no fixed cycle
  println(fan.run())
