sealed trait OrderState:                      // state: every action is "not allowed" by default
  def name: String
  def ship: OrderState = invalid("ship")
  def deliver: OrderState = invalid("deliver")
  def cancel: OrderState = invalid("cancel")

  protected def invalid(action: String): Nothing =
    throw IllegalStateException(s"Cannot $action an order that is $name")

case object Placed extends OrderState:
  val name = "placed"
  override def ship: OrderState = Shipped
  override def cancel: OrderState = Cancelled

case object Shipped extends OrderState:
  val name = "shipped"
  override def deliver: OrderState = Delivered

case object Delivered extends OrderState:
  val name = "delivered"

case object Cancelled extends OrderState:
  val name = "cancelled"

class Order(val id: String):                  // context: delegates to its current state
  private var state: OrderState = Placed

  def status: String = state.name
  def ship(): Unit = state = state.ship
  def deliver(): Unit = state = state.deliver
  def cancel(): Unit = state = state.cancel

@main def stateDemo(): Unit =
  val order = Order("A-101")
  order.ship()
  println(order.status)
  try order.cancel()
  catch case e: IllegalStateException => println(e.getMessage)
  order.deliver()
  println(order.status)

  val other = Order("A-102")
  other.cancel()
  println(s"${other.id} ${other.status}")
