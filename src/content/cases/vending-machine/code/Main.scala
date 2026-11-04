import scala.collection.mutable

enum Coin(val value: Int):
  case One extends Coin(1)
  case Two extends Coin(2)
  case Five extends Coin(5)
  case Ten extends Coin(10)

case class Product(name: String, price: Int)

/** Observer: hears when a slot runs empty. */
trait StockObserver:
  def onEmpty(code: String, product: Product): Unit

class RefillAlert extends StockObserver:
  def onEmpty(code: String, product: Product): Unit =
    println(s"  [alert] slot $code (${product.name}) is empty: please refill")

class Inventory:
  private val items = mutable.LinkedHashMap[String, Product]()
  private val counts = mutable.Map[String, Int]()
  private val observers = mutable.ArrayBuffer[StockObserver]()

  def subscribe(observer: StockObserver): Unit = observers += observer

  def add(code: String, product: Product, count: Int): Unit =
    items(code) = product
    counts(code) = counts.getOrElse(code, 0) + count

  def product(code: String): Option[Product] = items.get(code)
  def count(code: String): Int = counts.getOrElse(code, 0)
  def total: Int = counts.values.sum

  def take(code: String): Product =
    counts(code) -= 1
    if counts(code) == 0 then observers.foreach(_.onEmpty(code, items(code)))
    items(code)

/** Strategy: which coins to give back. None when the box can't make the amount. */
trait ChangeStrategy:
  def makeChange(amount: Int, box: Map[Coin, Int]): Option[List[Coin]]

/** Biggest coin first. Fast, and right for most coin sets, but can miss an answer when coins run low. */
class GreedyChange extends ChangeStrategy:
  def makeChange(amount: Int, box: Map[Coin, Int]): Option[List[Coin]] =
    var left = amount
    val out = mutable.ListBuffer[Coin]()
    for coin <- box.keys.toList.sortBy(-_.value) do
      val take = math.min(box(coin), left / coin.value)
      out ++= List.fill(take)(coin)
      left -= take * coin.value
    if left == 0 then Some(out.toList) else None

/** State: what each button does depends on what the machine is doing. */
trait VendingState:
  def insertCoin(machine: VendingMachine, coin: Coin): Unit
  def select(machine: VendingMachine, code: String): Unit
  def cancel(machine: VendingMachine): Unit
  def dispense(machine: VendingMachine): Unit

class IdleState extends VendingState:
  def insertCoin(machine: VendingMachine, coin: Coin): Unit =
    machine.accept(coin)
    machine.setState(HasMoneyState())
  def select(machine: VendingMachine, code: String): Unit = println("  insert coins first")
  def cancel(machine: VendingMachine): Unit = println("  nothing to cancel")
  def dispense(machine: VendingMachine): Unit = println("  nothing to dispense")

class HasMoneyState extends VendingState:
  def insertCoin(machine: VendingMachine, coin: Coin): Unit = machine.accept(coin)

  def select(machine: VendingMachine, code: String): Unit =
    machine.inventory.product(code).filter(_ => machine.inventory.count(code) > 0) match
      case None => println(s"  $code is not available, pick another")
      case Some(p) if machine.balance < p.price =>
        println(s"  ${p.name} costs ${p.price}, insert ${p.price - machine.balance} more")
      case Some(p) =>
        machine.change.makeChange(machine.balance - p.price, machine.boxAfterPayment) match
          case None => println("  can't make change for that: use exact money or cancel")
          case Some(coins) =>
            machine.setState(DispensingState(code, coins))
            machine.dispense()

  def cancel(machine: VendingMachine): Unit =
    println(s"  refund ${machine.refund().mkString("[", ", ", "]")}")
    machine.setState(IdleState())

  def dispense(machine: VendingMachine): Unit = println("  select a product first")

class DispensingState(val code: String, val coins: List[Coin]) extends VendingState:
  def insertCoin(machine: VendingMachine, coin: Coin): Unit = println(s"  busy, returning ${coin.value}")
  def select(machine: VendingMachine, code: String): Unit = println("  busy, please wait")
  def cancel(machine: VendingMachine): Unit = println("  too late to cancel")

  def dispense(machine: VendingMachine): Unit =
    val product = machine.inventory.take(code)
    machine.payOut(coins)
    println(s"  -> ${product.name}, change ${coins.map(_.value).mkString("[", ", ", "]")}")
    machine.setState(if machine.inventory.total == 0 then SoldOutState() else IdleState())

class SoldOutState extends VendingState:
  def insertCoin(machine: VendingMachine, coin: Coin): Unit = println(s"  sold out, returning ${coin.value}")
  def select(machine: VendingMachine, code: String): Unit = println("  sold out")
  def cancel(machine: VendingMachine): Unit = println("  nothing to cancel")
  def dispense(machine: VendingMachine): Unit = println("  nothing to dispense")

class VendingMachine(val inventory: Inventory, val change: ChangeStrategy):
  private var state: VendingState = if inventory.total > 0 then IdleState() else SoldOutState()
  private var box: Map[Coin, Int] = Coin.values.map(_ -> 2).toMap // float of coins for change
  private var inserted: List[Coin] = Nil

  def balance: Int = inserted.map(_.value).sum

  def setState(next: VendingState): Unit =
    println(s"  (${state.getClass.getSimpleName} -> ${next.getClass.getSimpleName})")
    state = next

  // buttons: each one is forwarded to the current state
  def insertCoin(coin: Coin): Unit = state.insertCoin(this, coin)
  def select(code: String): Unit = state.select(this, code)
  def cancel(): Unit = state.cancel(this)
  def dispense(): Unit = state.dispense(this)

  // helpers the states use
  def accept(coin: Coin): Unit =
    inserted = inserted :+ coin
    println(s"  balance $balance")

  def boxAfterPayment: Map[Coin, Int] =
    inserted.foldLeft(box)((b, c) => b.updated(c, b(c) + 1))

  def payOut(coins: List[Coin]): Unit =
    box = coins.foldLeft(boxAfterPayment)((b, c) => b.updated(c, b(c) - 1))
    inserted = Nil

  def refund(): List[Int] =
    val coins = inserted.map(_.value)
    inserted = Nil
    coins

  def restock(code: String, product: Product, count: Int): Unit =
    val wasEmpty = inventory.total == 0
    inventory.add(code, product, count)
    if wasEmpty then setState(IdleState())

@main def demo(): Unit =
  val stock = Inventory()
  stock.subscribe(RefillAlert())
  stock.add("A1", Product("Water", 15), 1)
  stock.add("B1", Product("Chips", 20), 1)
  val vm = VendingMachine(stock, GreedyChange())

  println("1) buy water with 10 + 10")
  List(Coin.Ten, Coin.Ten).foreach(vm.insertCoin)
  vm.select("A1")
  println("2) not enough money, then cancel")
  vm.insertCoin(Coin.Ten)
  vm.select("B1")
  vm.cancel()
  println("3) buy the last chips with exact money")
  vm.insertCoin(Coin.Ten)
  vm.insertCoin(Coin.Ten)
  vm.select("B1")
  println("4) machine is empty")
  vm.insertCoin(Coin.Five)
  vm.restock("A1", Product("Water", 15), 3)
  vm.insertCoin(Coin.Ten)
