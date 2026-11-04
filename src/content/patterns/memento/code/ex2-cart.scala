import scala.collection.mutable

final case class CartMemento(items: List[(String, Int)], discount: Int)   // memento

class Cart:                                                               // originator
  private val items = mutable.LinkedHashMap.empty[String, Int]
  private var discount = 0

  def add(sku: String, price: Int): Unit = items(sku) = price

  def applyCoupons(codes: List[String]): Unit =
    for code <- codes do
      code match
        case "FLAT100" => discount += 100
        case "FREESHIP" => items("shipping") = 0
        case other => throw IllegalArgumentException(s"coupon $other is not valid")

  def total: Int = items.values.sum - discount

  def save(): CartMemento = CartMemento(items.toList, discount)

  def restore(m: CartMemento): Unit =
    items.clear()
    items ++= m.items
    discount = m.discount

def applyAllOrNothing(cart: Cart, codes: List[String]): Unit =            // caretaker
  val checkpoint = cart.save()
  try
    cart.applyCoupons(codes)
    println(s"Applied ${codes.mkString(", ")}: total ₹${cart.total}")
  catch
    case err: IllegalArgumentException =>
      cart.restore(checkpoint)
      println(s"Rolled back (${err.getMessage}): total ₹${cart.total}")

@main def cartRollback(): Unit =
  val cart = Cart()
  cart.add("kurta", 1499)
  cart.add("shipping", 79)
  println(s"Start: total ₹${cart.total}")
  applyAllOrNothing(cart, List("FLAT100", "FREESHIP", "DIWALI90"))
  applyAllOrNothing(cart, List("FLAT100", "FREESHIP"))
