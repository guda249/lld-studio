// After: Car HAS an Engine (composition). Car shows only what a car does.

class Engine:
  var running = false
  def start(): String =
    running = true
    "engine on"

class Car:
  private val engine = Engine() // has-a: the car builds and owns its engine
  def drive(): String = engine.start() + ", car moving" // delegate the work

@main def oopBasicsCarAfter(): Unit =
  val car = Car()
  println(car.drive())
  // car.start() would not compile: the engine stays inside
