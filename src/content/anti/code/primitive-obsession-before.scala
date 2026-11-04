// Before: ids are String, money is Double, status is String. The compiler can't tell them apart.

def addPrice(total: Double, price: Double): Double = total + price

def refund(orderId: String, customerId: String, amount: Double, currency: String, status: String): String =
  if status != "delivered" then s"no refund for $orderId: status is '$status'"
  else s"refund $amount $currency to $customerId for order $orderId"

@main def primitiveObsessionBefore(): Unit =
  val total = List(0.10, 0.20).foldLeft(0.0)(addPrice)
  println(s"total: $total") // 0.30000000000000004
  println(refund("O-1001", "C-77", total, "INR", "Delivered")) // typo in status: refund wrongly refused
  println(refund("C-77", "O-1001", 5.0, "inr", "delivered")) // ids swapped, odd currency: compiles anyway
