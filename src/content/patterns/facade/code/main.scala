import scala.collection.mutable

class Inventory:
  private val stock = mutable.Map("BOOK-1" -> 5, "PEN-7" -> 0)
  def reserve(sku: String, qty: Int): Boolean =
    if stock.getOrElse(sku, 0) < qty then false
    else
      stock(sku) = stock(sku) - qty
      true

class PaymentService:
  def charge(user: String, amount: Int): String = s"PAY-$user-$amount"

class ShippingService:
  def schedule(user: String, sku: String): String = s"TRK-$sku-$user"

class Notifier:
  def send(user: String, text: String): Unit = println(s"  to $user: $text")

// One simple entry point. It only coordinates; the services do the work.
class OrderFacade(inventory: Inventory, payments: PaymentService,
                  shipping: ShippingService, notifier: Notifier):
  def placeOrder(user: String, sku: String, qty: Int, amount: Int): String =
    if !inventory.reserve(sku, qty) then "Out of stock"
    else
      val paymentRef = payments.charge(user, amount)
      val tracking = shipping.schedule(user, sku)
      notifier.send(user, s"Order confirmed, tracking $tracking")
      s"OK payment=$paymentRef tracking=$tracking"

@main def facadeDemo(): Unit =
  val inventory = Inventory()
  val shop = OrderFacade(inventory, PaymentService(), ShippingService(), Notifier())
  println(shop.placeOrder("asha", "BOOK-1", 1, 399))
  println(shop.placeOrder("ravi", "PEN-7", 2, 98))
  // The subsystem is still there for advanced use: an admin checks stock directly.
  println(s"admin can still reserve directly: ${inventory.reserve("BOOK-1", 2)}")
