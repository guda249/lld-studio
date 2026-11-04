import scala.collection.mutable.ListBuffer

class Order(val customer: String):
  val items = ListBuffer[String]()
  def add(item: String): Unit = items += item

class OrderService:
  def place(customer: String, item: String): Order =
    val order = Order(customer)  // «create»
    order.add(item)  // now it gets calls
    order

@main def demo(): Unit =
  val order = OrderService().place("Asha", "Masala Dosa")
  println(s"${order.customer} ${order.items.toList}")
