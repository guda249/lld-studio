class Order(val id: String):
  var status = "placed"

  def ship(): Unit =
    if status == "placed" then status = "shipped"
    else throw IllegalStateException(s"Cannot ship an order that is $status")

  def deliver(): Unit =
    if status == "shipped" then status = "delivered"
    else throw IllegalStateException(s"Cannot deliver an order that is $status")

  def cancel(): Unit =
    if status == "placed" then status = "cancelled"
    else if status == "shipped" || status == "delivered" then
      throw IllegalStateException("Too late to cancel")
    // forgot "cancelled": cancelling twice silently does nothing

@main def stateProblem(): Unit =
  val order = Order("A-101")
  order.ship()
  order.deliver()
  println(order.status)
  println("Adding a 'packed' state means editing every method above.")
