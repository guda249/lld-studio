class Order:
  var state = "Placed"  // the initial arrow
  private var finished = false

  private def move(to: String): Unit =
    if finished then  // final: no more changes
      throw IllegalStateException(s"order is over ($state)")
    state = to
    finished = true

  def deliver(): Unit = move("Delivered")
  def cancel(): Unit = move("Cancelled")

@main def demo(): Unit =
  val order = Order()
  println(order.state)  // Placed
  order.cancel()
  try order.deliver()
  catch case e: IllegalStateException => println(e.getMessage)
