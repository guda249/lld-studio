// Before: Car inherits from Engine to "get" start(). But a car is not an engine.

class Engine:
  var running = false
  def start(): String =
    running = true
    "engine on"

class Car extends Engine: // is-a: every Car is now also an Engine
  def drive(): String = start() + ", car moving"

@main def oopBasicsCarBefore(): Unit =
  val car = Car()
  println(car.drive())
  println(car.running) // Engine's insides are part of Car's public face
  val e: Engine = car // compiles: code that wants an Engine will accept a Car
  println(e.start())
