// Before: GiftCard says it is a PaymentMethod, but it can't do everything a PaymentMethod promises.

trait PaymentMethod:
  def pay(amount: Int): String
  def refund(amount: Int): String

class Card extends PaymentMethod:
  def pay(amount: Int): String = s"card charged $amount"
  def refund(amount: Int): String = s"card refunded $amount"

class GiftCard(private var balance: Int) extends PaymentMethod:
  def pay(amount: Int): String =
    balance -= amount
    s"gift card used, $balance left"
  def refund(amount: Int): String =
    throw UnsupportedOperationException("gift cards can't be refunded") // breaks the promise

def cancelOrder(method: PaymentMethod, amount: Int): String = // written long before GiftCard
  method.refund(amount)

@main def lspBefore(): Unit =
  println(cancelOrder(Card(), 499))
  try println(cancelOrder(GiftCard(1000), 499))
  catch case e: UnsupportedOperationException => println(s"crash in cancelOrder: ${e.getMessage}")
