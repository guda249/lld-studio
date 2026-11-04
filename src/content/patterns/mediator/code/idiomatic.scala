import scala.collection.mutable

class EventBus: // a generic mediator: senders and listeners share only topic names
  private val subs = mutable.Map.empty[String, mutable.ListBuffer[String => Unit]]

  def subscribe(topic: String, handler: String => Unit): Unit =
    subs.getOrElseUpdate(topic, mutable.ListBuffer.empty[String => Unit]) += handler

  def publish(topic: String, payload: String): Unit =
    subs.get(topic).foreach(handlers => handlers.foreach(handler => handler(payload)))

@main def eventBusDemo(): Unit =
  val bus = EventBus()
  bus.subscribe("order.placed", p => println(s"inventory: reserve stock for $p"))
  bus.subscribe("order.placed", p => println(s"email: confirmation for $p"))
  bus.subscribe("order.cancelled", p => println(s"payments: refund $p"))

  bus.publish("order.placed", "order #1042")
  bus.publish("order.cancelled", "order #1042")
  bus.publish("order.shipped", "order #1042") // nobody listens, nothing happens
  println("done")
