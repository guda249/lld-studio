class ParkingTicket                       // the name compartment: one noun, PascalCase

@main def demo(): Unit =
  val ticket = ParkingTicket()
  println(ticket.getClass.getSimpleName)  // ParkingTicket
