class Vehicle(val plate: String)

class Ticket(val vehicle: Vehicle)         // 1: a required constructor argument

@main def demo(): Unit =
  val ticket = Ticket(Vehicle("KA-01-1234"))
  println(ticket.vehicle.plate)
  // Ticket() would not even compile: a Ticket always has exactly one Vehicle
