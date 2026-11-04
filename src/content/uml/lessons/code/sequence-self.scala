class Bill(prices: List[Int]):
  def total(): Double =
    val sub = subtotal()  // self-call
    sub + tax(sub)  // self-call again

  def subtotal(): Int = prices.sum
  def tax(amount: Int): Double = amount * 0.05

@main def demo(): Unit =
  println(Bill(List(200, 300)).total())  // 525.0
