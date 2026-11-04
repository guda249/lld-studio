// After: only types that can keep the refund promise make it. Every subtype is safe to pass.

trait PaymentMethod: // every method can pay
  def pay(amount: Int): String

trait RefundablePayment extends PaymentMethod: // some can also refund
  def refund(amount: Int): String

class Card extends RefundablePayment:
  def pay(amount: Int): String = s"card charged $amount"
  def refund(amount: Int): String = s"card refunded $amount"

class GiftCard(private var balance: Int) extends PaymentMethod: // makes no promise it can't keep
  def pay(amount: Int): String =
    balance -= amount
    s"gift card used, $balance left"

def cancelOrder(method: RefundablePayment, amount: Int): String =
  method.refund(amount) // any RefundablePayment works here

def checkout(method: PaymentMethod, amount: Int): String =
  method.pay(amount) // any PaymentMethod works here

@main def lspAfter(): Unit =
  println(checkout(Card(), 499))
  println(checkout(GiftCard(1000), 499))
  println(cancelOrder(Card(), 499))
  // cancelOrder(GiftCard(1000), 499) does not compile
