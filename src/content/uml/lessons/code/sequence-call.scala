class PaymentGateway:
  def charge(amount: Int): String =
    println(s"  gateway: charging ₹$amount...")
    "PAID"

class Checkout(gateway: PaymentGateway):
  def pay(amount: Int): Unit =
    println("checkout: calling charge()")
    val status = gateway.charge(amount)  // waits here
    println(s"checkout: got $status, carry on")

@main def demo(): Unit =
  Checkout(PaymentGateway()).pay(499)
