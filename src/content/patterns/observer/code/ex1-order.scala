import scala.collection.mutable

trait OrderListener:                                   // observer
  def onStatus(orderId: String, status: String): Unit

class Order(val orderId: String):                      // subject
  var status = "PLACED"
  private val listeners = mutable.ListBuffer.empty[OrderListener]

  def subscribe(listener: OrderListener): Unit = listeners += listener

  def moveTo(newStatus: String): Unit =
    status = newStatus
    listeners.toList.foreach(_.onStatus(orderId, newStatus))

class CustomerSms(phone: String) extends OrderListener:
  def onStatus(orderId: String, status: String): Unit =
    println(s"SMS to $phone: order $orderId is ${status.toLowerCase.replace('_', ' ')}")

class RestaurantScreen extends OrderListener:
  def onStatus(orderId: String, status: String): Unit =
    if Set("PLACED", "CANCELLED", "PICKED_UP").contains(status) then
      println(s"Kitchen screen: $orderId -> $status")

class DeliveryStats extends OrderListener:
  val counts = mutable.LinkedHashMap.empty[String, Int]

  def onStatus(orderId: String, status: String): Unit =
    counts(status) = counts.getOrElse(status, 0) + 1

@main def orderUpdates(): Unit =
  val stats = DeliveryStats()
  val order = Order("BLR-4471")
  for listener <- List(CustomerSms("98450xxxxx"), RestaurantScreen(), stats) do
    order.subscribe(listener)

  for status <- List("PREPARING", "PICKED_UP", "DELIVERED") do
    order.moveTo(status)
  println(s"Stats: ${stats.counts.mkString(", ")}")
