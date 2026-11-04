class Bike:
  def fare(km: Double): Double = 1.0 + 0.5 * km
  def label: String = "bike"

class Car:
  def fare(km: Double): Double = 3.0 + 1.2 * km
  def label: String = "car"

class RideBooking(kind: String):
  def quote(km: Double): String =
    // every new vehicle type means editing this method
    if kind == "bike" then
      val vehicle = Bike()
      f"${vehicle.label} for $km km: $$${vehicle.fare(km)}%.2f"
    else if kind == "car" then
      val vehicle = Car()
      f"${vehicle.label} for $km km: $$${vehicle.fare(km)}%.2f"
    else throw IllegalArgumentException(s"unknown ride: $kind")

@main def demo(): Unit =
  for kind <- List("bike", "car") do
    println(RideBooking(kind).quote(4.0))
