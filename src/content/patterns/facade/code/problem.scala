class Inventory:
  def reserve(sku: String, qty: Int): Boolean = true

class PaymentService:
  def charge(user: String, amount: Int): String = s"PAY-$user-$amount"

class ShippingService:
  def schedule(user: String, sku: String): String = s"TRK-$sku-$user"

class Notifier:
  def send(user: String, text: String): Unit = println(s"to $user: $text")

// Every controller repeats the same four-service choreography, in the right order.
def checkoutController(user: String, sku: String, amount: Int): Unit =
  if Inventory().reserve(sku, 1) then
    PaymentService().charge(user, amount)
    val tracking = ShippingService().schedule(user, sku)
    Notifier().send(user, s"Order confirmed, tracking $tracking")

def reorderController(user: String, sku: String, amount: Int): Unit =
  if Inventory().reserve(sku, 1) then          // copy-pasted; one day someone forgets a step
    PaymentService().charge(user, amount)
    val tracking = ShippingService().schedule(user, sku)
    Notifier().send(user, s"Order confirmed, tracking $tracking")

@main def facadeProblem(): Unit =
  checkoutController("asha", "BOOK-1", 399)
  reorderController("ravi", "PEN-7", 49)
  println("Each controller depends on 4 services and on the order of their calls")
