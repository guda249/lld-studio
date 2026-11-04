import scala.collection.mutable

abstract class CartItem(val name: String): // component
  def price: Int
  def lines(depth: Int): List[String]

class Item(itemName: String, priceInr: Int) extends CartItem(itemName): // leaf
  def price: Int = priceInr
  def lines(depth: Int): List[String] = List("  " * depth + f"$name: ₹$priceInr%,d")

class Bundle(bundleName: String, discountPct: Int = 0) extends CartItem(bundleName): // composite + discount
  private val children = mutable.ListBuffer.empty[CartItem]

  def add(items: CartItem*): Bundle =
    children ++= items
    this

  def price: Int =
    val total = children.map(_.price).sum
    total * (100 - discountPct) / 100

  def lines(depth: Int): List[String] =
    val head = "  " * depth + f"$name ($discountPct%d%% off): ₹$price%,d"
    head :: children.toList.flatMap(_.lines(depth + 1))

@main def bundleCompositeDemo(): Unit =
  val diwaliBox = Bundle("Diwali gift box", 10).add(
    Item("Kaju katli 500 g", 650),
    Item("Diya set", 300),
    Bundle("Dry fruit pack", 5).add(Item("Almonds", 450), Item("Cashews", 550))
  )
  val cart: List[CartItem] = List(Item("Phone cover", 299), diwaliBox)
  for entry <- cart do println(entry.lines(0).mkString("\n"))
  val total = cart.map(_.price).sum
  println(f"Cart total: ₹$total%,d")
