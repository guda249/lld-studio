// A coin-operated machine in a laundromat. Every action checks the status string.
class WashingMachine:
  var status = "idle"

  def pay(): Unit =
    if status == "idle" then
      status = "paid"
      println("paid: press start")
    else println(s"can't pay while $status")

  def start(): Unit =
    if status == "paid" then
      status = "washing"
      println("washing...")
    else if status == "idle" then println("please pay first")
    else println(s"can't start while $status")

  def finish(): Unit =
    if status == "washing" then
      status = "done"
      println("done: open the door")
    else println(s"can't finish while $status")

  def openDoor(): Unit =
    if status == "done" then
      status = "idle"
      println("door open: take your laundry")
    else if status == "washing" then println("door locked while washing")
    else println(s"can't open the door while $status")

@main def demo(): Unit =
  val machine = WashingMachine()
  machine.start()
  machine.pay()
  machine.pay()
  machine.start()
  machine.openDoor()
  machine.finish()
  machine.openDoor()
  println(s"status: ${machine.status}")
