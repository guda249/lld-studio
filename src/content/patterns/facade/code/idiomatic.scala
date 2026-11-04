import scala.collection.mutable

// A singleton object is the facade; its private members are the subsystem.
object Orders:
  private val stock = mutable.Map("BOOK-1" -> 5)

  private def reserve(sku: String, qty: Int): Boolean =
    if stock.getOrElse(sku, 0) < qty then false
    else
      stock(sku) = stock(sku) - qty
      true

  private def charge(user: String, amount: Int): String = s"PAY-$user-$amount"
  private def ship(user: String, sku: String): String = s"TRK-$sku-$user"

  def placeOrder(user: String, sku: String, qty: Int, amount: Int): String =
    if !reserve(sku, qty) then "Out of stock"
    else s"OK payment=${charge(user, amount)} tracking=${ship(user, sku)}"

@main def facadeIdiomatic(): Unit =
  println(Orders.placeOrder("asha", "BOOK-1", 1, 399))
  println(Orders.placeOrder("ravi", "BOOK-1", 9, 3591))
