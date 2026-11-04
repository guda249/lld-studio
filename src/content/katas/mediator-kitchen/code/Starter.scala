import scala.collection.mutable

class Waiter:
  var grill: Grill = null
  var fryer: Fryer = null

  def takeOrder(table: Int): Unit =
    println(s"table $table: order sent to grill and fryer")
    grill.start(table)
    fryer.start(table)

  def serve(table: Int): Unit = println(s"table $table: served")

class Grill(waiter: Waiter):
  var fryer: Fryer = null
  val cooking = mutable.Set.empty[Int]

  def start(table: Int): Unit = cooking += table

  def finish(table: Int): Unit =
    cooking -= table
    println(s"  grill: burger for table $table ready")
    if !fryer.cooking.contains(table) then waiter.serve(table) // the grill peeks inside the fryer

class Fryer(waiter: Waiter):
  var grill: Grill = null
  val cooking = mutable.Set.empty[Int]

  def start(table: Int): Unit = cooking += table

  def finish(table: Int): Unit =
    cooking -= table
    println(s"  fryer: fries for table $table ready")
    if !grill.cooking.contains(table) then waiter.serve(table) // and the fryer peeks inside the grill

@main def demo(): Unit =
  val waiter = Waiter()
  val grill = Grill(waiter)
  val fryer = Fryer(waiter)
  waiter.grill = grill
  waiter.fryer = fryer
  grill.fryer = fryer // everyone wired to everyone
  fryer.grill = grill
  waiter.takeOrder(1)
  waiter.takeOrder(2)
  grill.finish(1)
  fryer.finish(2)
  fryer.finish(1)
  grill.finish(2)
