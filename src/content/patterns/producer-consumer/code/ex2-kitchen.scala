import java.util.concurrent.{ArrayBlockingQueue, ConcurrentLinkedQueue}
import scala.collection.mutable.ArrayBuffer
import scala.jdk.CollectionConverters.*

class TicketRail(capacity: Int, policy: String):    // the bounded buffer between waiters and chefs
  private val tickets = ArrayBlockingQueue[String](capacity)
  val turnedAway = ArrayBuffer[String]()

  def add(order: String): Unit =                     // waiter (producer) side
    if !tickets.offer(order) then
      if policy == "reject" then turnedAway += order // say "kitchen busy" to the newest order
      else                                           // "drop oldest": make room for the newest order
        turnedAway += tickets.poll()
        tickets.offer(order)

  def take(): Option[String] = Option(tickets.poll()) // chef (consumer) side

class Chef(rail: TicketRail, cooked: ConcurrentLinkedQueue[String]) extends Thread:
  override def run(): Unit =
    var order = rail.take()
    while order.isDefined do
      cooked.add(order.get)
      order = rail.take()

def fridayRush(capacity: Int, policy: String): String =
  val rail = TicketRail(capacity, policy)
  for order <- List("#101", "#102", "#103", "#104", "#105") do
    rail.add(order)                                  // both chefs are still busy, so nothing is taken yet
  val cooked = ConcurrentLinkedQueue[String]()
  val chefs = List.fill(2)(Chef(rail, cooked))
  chefs.foreach(_.start())
  chefs.foreach(_.join())
  s"cooked ${cooked.asScala.toList.sorted.mkString(" ")} | away ${rail.turnedAway.mkString(" ")}"

@main def kitchenDemo(): Unit =
  for capacity <- List(2, 3, 4); policy <- List("reject", "drop oldest") do
    println(s"rail of $capacity, $policy: ${fridayRush(capacity, policy)}")
