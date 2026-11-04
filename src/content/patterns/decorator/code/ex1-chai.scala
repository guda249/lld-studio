trait Beverage:
  def description: String
  def cost: Int

class MasalaChai extends Beverage:
  def description: String = "Masala chai"
  def cost: Int = 40

class FilterCoffee extends Beverage:
  def description: String = "Filter coffee"
  def cost: Int = 50

// Base decorator: wraps any beverage, including another add-on.
abstract class AddOn(drink: Beverage) extends Beverage

class Ginger(drink: Beverage) extends AddOn(drink):
  def description: String = drink.description + " + ginger"
  def cost: Int = drink.cost + 10

class Jaggery(drink: Beverage) extends AddOn(drink):
  def description: String = drink.description + " + jaggery"
  def cost: Int = drink.cost + 15

class OatMilk(drink: Beverage) extends AddOn(drink):
  def description: String = drink.description + " + oat milk"
  def cost: Int = drink.cost + 35

@main def chaiOrders(): Unit =
  val orders: List[Beverage] = List(
    MasalaChai(),
    Ginger(Jaggery(MasalaChai())),
    OatMilk(OatMilk(FilterCoffee()))
  )
  for order <- orders do
    println(f"${order.description}%-42s ₹${order.cost}")
