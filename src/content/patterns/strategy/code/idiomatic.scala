class Checkout(pay: BigDecimal => String):
  def checkout(amount: BigDecimal): String = pay(amount)

def upi(amount: BigDecimal): String = s"Paid ₹$amount via UPI"

def card(amount: BigDecimal): String = s"Paid ₹$amount by card"

@main def idiomaticDemo(): Unit =
  println(Checkout(upi).checkout(500))
  println(Checkout(card).checkout(500))
  println(Checkout(a => s"Paid ₹$a with PayLater").checkout(500))  // a strategy made on the spot
