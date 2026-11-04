class Customer(val name: String)

class Order(val id: String, val customer: Customer):   // the line Order → Customer
  def total(): Double = 499.0

@main def demo(): Unit =
  val order = Order("A-101", Customer("Asha"))
  println(s"${order.id} ${order.customer.name} ${order.total()}")   // A-101 Asha 499.0
