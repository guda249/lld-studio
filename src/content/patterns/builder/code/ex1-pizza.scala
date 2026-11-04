import scala.collection.mutable

val sizePrice: Map[String, Int] = Map("small" -> 199, "medium" -> 349, "large" -> 499)
val toppingPrice = 40

final case class Pizza(size: String, crust: String, toppings: List[String], extraCheese: Boolean):
  def price: Int = sizePrice(size) + toppingPrice * toppings.size + (if extraCheese then 60 else 0)

final class PizzaBuilder(size: String):
  private var crust = "classic"
  private val toppings = mutable.ListBuffer.empty[String]
  private var extraCheese = false

  def withCrust(c: String): PizzaBuilder =
    crust = c
    this

  def withTopping(name: String): PizzaBuilder =
    toppings += name
    this

  def withExtraCheese(): PizzaBuilder =
    extraCheese = true
    this

  def build(): Pizza =
    if !sizePrice.contains(size) then throw IllegalArgumentException(s"unknown size $size")
    if toppings.size > 5 then throw IllegalArgumentException("at most 5 toppings")
    Pizza(size, crust, toppings.toList, extraCheese)

// the director: named recipes that run a fixed sequence of builder steps
def margherita(size: String): Pizza =
  PizzaBuilder(size).withTopping("basil").withExtraCheese().build()

def farmhouse(size: String): Pizza =
  PizzaBuilder(size).withCrust("thin").withTopping("onion").withTopping("capsicum").withTopping("mushroom").build()

@main def pizzaDemo(): Unit =
  val custom = PizzaBuilder("small").withCrust("cheese burst").withTopping("paneer").withTopping("jalapeno").build()
  val orders = List("Margherita" -> margherita("medium"), "Farmhouse" -> farmhouse("large"), "Custom" -> custom)
  for (name, pizza) <- orders do
    println(s"$name: ${pizza.size}, ${pizza.crust} crust, ${pizza.toppings.mkString(", ")} -> ₹${pizza.price}")
