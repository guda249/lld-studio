class Inventory:
  private val stock = Map("pen" -> 3, "ink" -> 0)
  def inStock(sku: String): Boolean =
    stock.getOrElse(sku, 0) > 0  // return

class Cart(inventory: Inventory):
  def add(sku: String): String =
    val ok = inventory.inStock(sku)  // gets the return
    s"$sku: ${if ok then "added" else "sold out"}"

@main def demo(): Unit =
  val cart = Cart(Inventory())
  println(cart.add("pen"))  // pen: added
  println(cart.add("ink"))  // ink: sold out
