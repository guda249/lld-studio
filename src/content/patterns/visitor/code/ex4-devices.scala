trait DeviceVisitor[R]:
  def visitThermostat(t: Thermostat): R
  def visitCamera(c: Camera): R
  def visitDoorLock(d: DoorLock): R

sealed trait Device:
  def name: String
  def accept[R](v: DeviceVisitor[R]): R

final case class Thermostat(name: String, targetC: Int, hoursOn: Double) extends Device:
  def accept[R](v: DeviceVisitor[R]): R = v.visitThermostat(this)

final case class Camera(name: String, resolution: String, freeStorageGb: Int) extends Device:
  def accept[R](v: DeviceVisitor[R]): R = v.visitCamera(this)

final case class DoorLock(name: String, batteryPct: Int) extends Device:
  def accept[R](v: DeviceVisitor[R]): R = v.visitDoorLock(this)

object EnergyVisitor extends DeviceVisitor[Double]:     // kWh per day, sample figures
  def visitThermostat(t: Thermostat): Double = 1.2 * t.hoursOn
  def visitCamera(c: Camera): Double = if c.resolution == "4K" then 0.48 else 0.24
  def visitDoorLock(d: DoorLock): Double = 0.01

object HealthCheckVisitor extends DeviceVisitor[String]:
  def visitThermostat(t: Thermostat): String =
    if t.targetC >= 16 && t.targetC <= 30 then "OK" else "check target temperature"
  def visitCamera(c: Camera): String =
    if c.freeStorageGb < 5 then "storage low" else "OK"
  def visitDoorLock(d: DoorLock): String =
    if d.batteryPct < 20 then "replace battery" else "OK"

@main def devicesDemo(): Unit =
  val home: List[Device] = List(
    Thermostat("Bedroom AC", 24, 6.0),
    Camera("Gate camera", "4K", 3),
    DoorLock("Front door", 15)
  )
  for device <- home do
    val kwh = device.accept(EnergyVisitor)
    val status = device.accept(HealthCheckVisitor)
    println(f"${device.name}%-12s $kwh%5.2f kWh/day  $status")
  val total = home.map(_.accept(EnergyVisitor)).sum
  println(f"total: $total%.2f kWh/day")
