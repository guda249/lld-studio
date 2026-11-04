class Card:
  def charge(amount: Double): Boolean =
    println(s"charged $amount")
    true

class Ticket(hours: Int):
  def fee(rate: Double): Double = hours * rate                // + fee(rate: Real): Real
  def pay(card: Card): Boolean = card.charge(fee(40.0))       // + pay(card: Card): Boolean

@main def demo(): Unit = println(Ticket(3).pay(Card()))       // charged 120.0, then true
