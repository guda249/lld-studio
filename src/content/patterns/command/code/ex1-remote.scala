import scala.collection.mutable

class Light(val room: String): // receiver
  var on: Boolean = false
  def switch(turnOn: Boolean): Unit =
    on = turnOn
    println(s"  $room light ${if turnOn then "ON" else "OFF"}")

class Fan(val room: String): // receiver
  var speed: Int = 0
  def setSpeed(newSpeed: Int): Unit =
    speed = newSpeed
    println(s"  $room fan speed $newSpeed")

trait Command:
  def execute(): Unit
  def undo(): Unit

class LightOn(light: Light) extends Command:
  def execute(): Unit = light.switch(true)
  def undo(): Unit = light.switch(false)

class FanSpeed(fan: Fan, speed: Int) extends Command:
  private var previous: List[Int] = Nil // a stack, so pressing twice still undoes correctly

  def execute(): Unit =
    previous = fan.speed :: previous
    fan.setSpeed(speed)

  def undo(): Unit =
    fan.setSpeed(previous.head)
    previous = previous.tail

class RemoteControl: // invoker
  private val slots = mutable.Map.empty[String, Command]
  private var history: List[Command] = Nil

  def assign(button: String, command: Command): Unit = slots(button) = command

  def press(button: String): Unit =
    println(s"[$button]")
    val command = slots(button)
    command.execute()
    history = command :: history

  def pressUndo(): Unit =
    println("[undo]")
    history match
      case last :: rest =>
        last.undo()
        history = rest
      case Nil => println("  nothing to undo")

@main def remoteDemo(): Unit =
  val light = Light("Bedroom")
  val fan = Fan("Bedroom")
  val remote = RemoteControl()
  remote.assign("1", LightOn(light))
  remote.assign("2", FanSpeed(fan, 3))
  remote.assign("3", FanSpeed(fan, 5))

  remote.press("1")
  remote.press("2")
  remote.press("3")
  remote.pressUndo()
  remote.pressUndo()
  remote.pressUndo()
  remote.pressUndo()
