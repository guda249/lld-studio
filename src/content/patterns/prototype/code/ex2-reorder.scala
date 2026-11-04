import scala.collection.mutable

class LineItem(val product: String, var qty: Int):
  def duplicate(): LineItem = LineItem(product, qty)

class Order(var orderId: String, val items: mutable.ListBuffer[LineItem]):
  // new Order, but the SAME LineItem objects inside
  def shallowDuplicate(): Order = Order(orderId, mutable.ListBuffer.from(items))

  // new Order with its own LineItem objects
  def duplicate(): Order = Order(orderId, items.map(_.duplicate()))

def describe(order: Order): String =
  s"${order.orderId}: " + order.items.map(i => s"${i.qty} x ${i.product}").mkString(", ")

@main def reorderDemo(): Unit =
  val past = Order("ORD-1", mutable.ListBuffer(LineItem("atta 5kg", 1), LineItem("toor dal", 2)))

  val bad = past.shallowDuplicate()
  bad.orderId = "ORD-2"
  bad.items.head.qty = 3 // the customer wants more atta this time
  println("Shallow copy:")
  println(s"  ${describe(bad)}")
  println(s"  ${describe(past)}   <- the old order changed too")

  past.items.head.qty = 1 // put the history back
  val good = past.duplicate()
  good.orderId = "ORD-3"
  good.items.head.qty = 3
  println("Deep copy:")
  println(s"  ${describe(good)}")
  println(s"  ${describe(past)}   <- history is safe")
