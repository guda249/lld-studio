class Receipt(val amount: Int)

class Gateway:
  def charge(amount: Int): Receipt =
    Receipt(amount)  // 3 «create», 4 return

class Shop(gateway: Gateway):
  def buy(price: Int): String =
    val receipt = gateway.charge(price)  // 2
    log(receipt)  // 5 self-call
    "thanks"  // 6 return

  def log(receipt: Receipt): Unit =
    println(s"paid ₹${receipt.amount}")

@main def demo(): Unit =
  println(Shop(Gateway()).buy(250))  // 1
