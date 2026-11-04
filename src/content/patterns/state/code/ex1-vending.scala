trait MachineState:                                    // state
  def label: String

  def insert(m: VendingMachine, rupees: Int): Unit =
    println(s"  $label: cannot take money now, returning ₹$rupees")

  def select(m: VendingMachine): Unit =
    println(s"  $label: insert money first")

class Idle extends MachineState:
  val label = "Idle"

  override def insert(m: VendingMachine, rupees: Int): Unit =
    m.credit += rupees
    println(s"  credit ₹${m.credit}")
    m.state = HasMoney()                               // the state picks the next state

class HasMoney extends MachineState:
  val label = "HasMoney"

  override def insert(m: VendingMachine, rupees: Int): Unit =
    m.credit += rupees
    println(s"  credit ₹${m.credit}")

  override def select(m: VendingMachine): Unit =
    if m.credit < m.price then println(s"  need ₹${m.price - m.credit} more")
    else
      m.stock -= 1
      println(s"  dispensing chips, change ₹${m.credit - m.price}")
      m.credit = 0
      m.state = if m.stock == 0 then SoldOut() else Idle()

class SoldOut extends MachineState:
  val label = "SoldOut"

  override def select(m: VendingMachine): Unit =
    println("  SoldOut: nothing left, please call the operator")

class VendingMachine(var stock: Int, val price: Int):  // context
  var credit = 0
  var state: MachineState = Idle()

  def insert(rupees: Int): Unit = state.insert(this, rupees)
  def select(): Unit = state.select(this)

@main def vendingDemo(): Unit =
  val machine = VendingMachine(stock = 1, price = 30)
  val actions = List(("select", 0), ("insert", 20), ("select", 0),
                     ("insert", 20), ("select", 0), ("insert", 10), ("select", 0))
  for (action, amount) <- actions do
    val shown = if amount == 0 then "" else amount.toString
    println(s"$action $shown [${machine.state.label}]")
    if action == "insert" then machine.insert(amount) else machine.select()
