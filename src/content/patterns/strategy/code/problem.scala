class Checkout:
  def pay(kind: String, amount: BigDecimal): String = kind match
    case "card"   => s"Paid ₹$amount by card"
    case "upi"    => s"Paid ₹$amount via UPI"
    case "wallet" => s"Paid ₹$amount from wallet"
    case other    => throw IllegalArgumentException(other)
    // every new type edits this method

@main def problemDemo(): Unit =
  val checkout = Checkout()
  println(checkout.pay("card", 1200))
  println(checkout.pay("upi", 1200))
  try checkout.pay("paylater", 1200)
  catch case e: IllegalArgumentException =>
    println(s"Unsupported: ${e.getMessage} -> edit Checkout.pay again")
