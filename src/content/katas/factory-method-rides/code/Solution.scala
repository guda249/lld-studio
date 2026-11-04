trait Vehicle:
  def fare(km: Double): Double
  def label: String

class Bike extends Vehicle:
  def fare(km: Double): Double = 1.0 + 0.5 * km
  def label: String = "bike"

class Car extends Vehicle:
  def fare(km: Double): Double = 3.0 + 1.2 * km
  def label: String = "car"

abstract class RideBooking:
  protected def createVehicle(): Vehicle // the factory method

  def quote(km: Double): String = // shared logic, never changes
    val vehicle = createVehicle()
    f"${vehicle.label} for $km km: $$${vehicle.fare(km)}%.2f"

class BikeBooking extends RideBooking:
  protected def createVehicle(): Vehicle = Bike()

class CarBooking extends RideBooking:
  protected def createVehicle(): Vehicle = Car()

@main def demo(): Unit =
  val bookings: List[RideBooking] = List(BikeBooking(), CarBooking())
  bookings.foreach(b => println(b.quote(4.0)))
