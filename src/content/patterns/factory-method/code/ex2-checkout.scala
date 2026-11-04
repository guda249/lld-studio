trait PaymentGateway:
  def charge(amount: Double): String

class UpiGateway extends PaymentGateway:
  def charge(amount: Double): String = f"UPI collect request for ₹$amount%.2f sent"

class CardGateway extends PaymentGateway:
  def charge(amount: Double): String =
    val fee = amount * 0.02
    val total = amount + fee
    f"card charged ₹$total%.2f (incl. 2%% fee)"

class Checkout:
  // factory method with a sensible default: UPI
  def createGateway(): PaymentGateway = UpiGateway()

  def pay(orderId: String, amount: Double): String =
    if amount <= 0 then s"$orderId: invalid amount"
    else
      val gateway = createGateway()
      s"$orderId: ${gateway.charge(amount)}"

class CardCheckout extends Checkout:
  // only the creation step changes; pay() is inherited untouched
  override def createGateway(): PaymentGateway = CardGateway()

@main def checkoutDemo(): Unit =
  println(Checkout().pay("ORD-101", 499))
  println(CardCheckout().pay("ORD-102", 1200))
  println(Checkout().pay("ORD-103", 0))
