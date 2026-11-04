class Kitchen:
  def cook(dish: String): String = s"$dish is ready"

class Waiter(kitchen: Kitchen):
  def takeOrder(dish: String): String = kitchen.cook(dish)

@main def demo(): Unit =
  // each object = one participant
  val kitchen = Kitchen()
  val waiter = Waiter(kitchen)
  println(waiter.takeOrder("Dosa"))  // Dosa is ready
