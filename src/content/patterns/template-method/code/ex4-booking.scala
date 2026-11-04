abstract class BookingFlow:
  final def book(traveller: String, price: Int): String =   // the template method
    holdInventory()
    if needsIdCheck then                                    // optional step, switched by a hook
      println(s"  ID check passed for $traveller")
    println(f"  charged ₹${price + convenienceFee}%,d")
    createTicket(traveller)                                 // a factory-method step

  protected def holdInventory(): Unit
  protected def createTicket(traveller: String): String

  protected def needsIdCheck: Boolean = false               // hook
  protected def convenienceFee: Int = 0                     // hook

class FlightBooking extends BookingFlow:
  protected def holdInventory(): Unit = println("  seat 14C held on BLR -> DEL")
  override protected def needsIdCheck: Boolean = true
  override protected def convenienceFee: Int = 350
  protected def createTicket(traveller: String): String =
    s"Boarding pass: $traveller, BLR -> DEL, seat 14C"

class HotelBooking extends BookingFlow:
  protected def holdInventory(): Unit = println("  room 204 held in Jaipur for 2 nights")
  protected def createTicket(traveller: String): String =
    s"Hotel voucher: $traveller, Jaipur, room 204"

@main def bookingDemo(): Unit =
  for flow <- List(FlightBooking(), HotelBooking()) do
    println(flow.getClass.getSimpleName)
    println(s"  ${flow.book("Karan", 5400)}")
