class Vehicle(val plate: String)

class Ticket(
    private val id: String,               // - id: String
    private val hours: Int,               // - hours: Integer
    private val vehicle: Vehicle          // - vehicle: Vehicle (also drawn as a line)
):
  def summary(): String = s"$id: ${vehicle.plate} for $hours h"

@main def demo(): Unit =
  println(Ticket("T-7", 3, Vehicle("KA-01-1234")).summary())   // T-7: KA-01-1234 for 3 h
