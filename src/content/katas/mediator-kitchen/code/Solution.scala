import scala.collection.mutable

// The mediator interface: the only thing waiters and stations know about.
trait Kitchen:
  def order(table: Int): Unit
  def dishReady(station: String, table: Int): Unit

class Waiter(kitchen: Kitchen):
  def takeOrder(table: Int): Unit = kitchen.order(table)
  def serve(table: Int): Unit = println(s"table $table: served")

class Station(kitchen: Kitchen, val name: String, dish: String):
  def finish(table: Int): Unit =
    println(s"  $name: $dish for table $table ready")
    kitchen.dishReady(name, table)

// The concrete mediator: knows every station and the waiter, and owns the rule "serve when all dishes are ready".
class KitchenPass extends Kitchen:
  private val stations = mutable.ListBuffer.empty[Station]
  var waiter: Option[Waiter] = None
  private val waiting = mutable.Map.empty[Int, mutable.Set[String]]

  def addStation(station: Station): Unit = stations += station

  def order(table: Int): Unit =
    val names = stations.map(_.name)
    println(s"table $table: order sent to ${names.mkString(" and ")}")
    waiting(table) = mutable.Set.from(names) // the kitchen, not the stations, tracks what is still cooking

  def dishReady(station: String, table: Int): Unit =
    waiting(table) -= station
    if waiting(table).isEmpty then waiter.foreach(_.serve(table))

@main def demo(): Unit =
  val kitchen = KitchenPass()
  val waiter = Waiter(kitchen)
  kitchen.waiter = Some(waiter)
  val grill = Station(kitchen, "grill", "burger")
  val fryer = Station(kitchen, "fryer", "fries")
  kitchen.addStation(grill)
  kitchen.addStation(fryer) // a drinks bar would be one more line here
  waiter.takeOrder(1)
  waiter.takeOrder(2)
  grill.finish(1)
  fryer.finish(2)
  fryer.finish(1)
  grill.finish(2)
