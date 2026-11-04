trait Vehicle:                                // product 1
  def carry(parcel: String): String

trait Package:                                // product 2: must MATCH the vehicle
  def wrap(item: String): String

class Bike extends Vehicle:
  def carry(parcel: String): String = s"$parcel by bike"

class Truck extends Vehicle:
  def carry(parcel: String): String = s"$parcel by truck"

class Pouch extends Package:
  def wrap(item: String): String = s"$item in a pouch"

class Crate extends Package:
  def wrap(item: String): String = s"$item in a crate"

trait DeliveryKit:                            // abstract factory: one method per product
  def createVehicle(): Vehicle
  def createPackage(): Package

class CityKit extends DeliveryKit:            // family 1: bike + pouch
  def createVehicle(): Vehicle = Bike()
  def createPackage(): Package = Pouch()

class FreightKit extends DeliveryKit:         // family 2: truck + crate
  def createVehicle(): Vehicle = Truck()
  def createPackage(): Package = Crate()

class Dispatcher(kit: DeliveryKit):           // client: gets a whole kit, can't mix families
  def send(item: String): String =
    val pkg: Package = kit.createPackage()
    val vehicle: Vehicle = kit.createVehicle()
    s"Delivered ${vehicle.carry(pkg.wrap(item))}"

@main def demo(): Unit =
  for kit <- List(CityKit(), FreightKit()) do
    println(Dispatcher(kit).send("books"))
