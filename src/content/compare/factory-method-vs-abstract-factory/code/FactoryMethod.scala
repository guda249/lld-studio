trait Vehicle:                                // product
  def carry(parcel: String): String

class Bike extends Vehicle:
  def carry(parcel: String): String = s"$parcel by bike"

class Truck extends Vehicle:
  def carry(parcel: String): String = s"$parcel by truck"

abstract class Delivery:                      // creator: the shared steps live here
  def createVehicle(): Vehicle                // the factory method: ONE product

  def deliver(parcel: String): String =
    val vehicle: Vehicle = createVehicle()             // a subclass decides which vehicle
    s"Delivered ${vehicle.carry(parcel)}"

class CityDelivery extends Delivery:
  def createVehicle(): Vehicle = Bike()

class FreightDelivery extends Delivery:
  def createVehicle(): Vehicle = Truck()

@main def demo(): Unit =
  for delivery <- List(CityDelivery(), FreightDelivery()) do
    println(delivery.deliver("books"))
