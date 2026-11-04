import scala.collection.mutable

trait SensorObserver:                                  // observer (pull model)
  def refresh(sensor: TemperatureSensor): Unit

class TemperatureSensor(val room: String):             // subject
  var celsius = 0.0
  private val observers = mutable.ListBuffer.empty[SensorObserver]

  def attach(observer: SensorObserver): Unit = observers += observer

  def reading(value: Double): Unit =
    if value != celsius then                           // no change, no noise
      celsius = value
      observers.toList.foreach(_.refresh(this))        // observers pull what they need

class AirConditioner(switchOnAt: Double) extends SensorObserver:
  var on = false

  def refresh(sensor: TemperatureSensor): Unit =
    val wanted = sensor.celsius >= switchOnAt
    if wanted != on then
      on = wanted
      println(s"AC in ${sensor.room} turned ${if wanted then "ON" else "OFF"} at ${sensor.celsius}°C")

class AppTile extends SensorObserver:
  def refresh(sensor: TemperatureSensor): Unit =
    println(s"  app tile: ${sensor.room} ${sensor.celsius}°C")

@main def sensorAlerts(): Unit =
  val sensor = TemperatureSensor("Bedroom")
  sensor.attach(AirConditioner(switchOnAt = 28.0))
  sensor.attach(AppTile())
  for value <- List(26.5, 28.5, 28.5, 29.0, 25.0) do
    sensor.reading(value)
