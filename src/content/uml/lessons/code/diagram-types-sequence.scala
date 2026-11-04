class Cart:
  def total(): Int = 499

class Payment:
  def charge(amount: Int): String = s"paid $amount"

def checkout(cart: Cart, payment: Payment): String =
  val amount = cart.total()               // 1. ask the cart, 2. it answers
  payment.charge(amount)                  // 3. charge, 4. the answer comes back

@main def demo(): Unit = println(checkout(Cart(), Payment()))   // paid 499
