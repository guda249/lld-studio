import scala.collection.mutable

class SeatLock:
  val locked = mutable.Set.empty[String]

  def lock(seats: List[String]): Boolean =
    if seats.exists(locked.contains) then false
    else
      locked ++= seats
      true

  def release(seats: List[String]): Unit = locked --= seats

class PaymentGateway:
  def pay(upiId: String, amount: Int): Boolean = !upiId.startsWith("broke") // pretend this one bounces

class TicketService:
  def issue(show: String, seats: List[String]): String = s"TICKET $show ${seats.mkString(",")}"

// Hides the order of steps AND the clean-up when a step fails.
class BookingFacade(seats: SeatLock, payments: PaymentGateway, tickets: TicketService):
  def book(show: String, wanted: List[String], upiId: String, price: Int): String =
    if !seats.lock(wanted) then "Seats already taken"
    else if !payments.pay(upiId, price * wanted.size) then
      seats.release(wanted)                      // compensate: free the seats again
      "Payment failed, seats released"
    else tickets.issue(show, wanted)

@main def ticketBooking(): Unit =
  val seatLock = SeatLock()
  val bms = BookingFacade(seatLock, PaymentGateway(), TicketService())
  println(bms.book("Pushpa 2, 7 pm", List("F7", "F8"), "asha@upi", 250))
  println(bms.book("Pushpa 2, 7 pm", List("F8", "F9"), "ravi@upi", 250))
  println(bms.book("Pushpa 2, 7 pm", List("G1"), "broke@upi", 250))
  println(s"locked seats: ${seatLock.locked.toList.sorted}")
