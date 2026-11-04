// Base state: refuses every action. Each state overrides only the actions it allows.
abstract class MachineState(val name: String):
  def pay(): MachineState = refuse("pay")
  def start(): MachineState = refuse("start")
  def finish(): MachineState = refuse("finish")
  def openDoor(): MachineState = refuse("open the door")

  protected def refuse(action: String): MachineState =
    println(s"can't $action while $name")
    this

class Idle extends MachineState("idle"):
  override def pay(): MachineState =
    println("paid: press start")
    Paid()

  override def start(): MachineState =
    println("please pay first")
    this

class Paid extends MachineState("paid"):
  override def start(): MachineState =
    println("washing...")
    Washing()

class Washing extends MachineState("washing"):
  override def finish(): MachineState =
    println("done: open the door")
    Done()

  override def openDoor(): MachineState =
    println("door locked while washing")
    this

class Done extends MachineState("done"):
  override def openDoor(): MachineState =
    println("door open: take your laundry")
    Idle()

// The context: holds the current state and hands every action to it.
class WashingMachine:
  private var state: MachineState = Idle()

  def status: String = state.name
  def pay(): Unit = state = state.pay()
  def start(): Unit = state = state.start()
  def finish(): Unit = state = state.finish()
  def openDoor(): Unit = state = state.openDoor()

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
