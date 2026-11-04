import scala.collection.mutable.{LinkedHashMap, ListBuffer}

def money(paise: Int): String =
  val sign = if paise < 0 then "-" else ""
  s"${sign}₹${paise.abs / 100}." + "%02d".format(paise.abs % 100)

case class User(id: String, name: String)

// ---------- Strategy: how one bill is cut into shares (amounts are whole paise, never floats) ----------
trait SplitStrategy:
  def label: String
  def split(total: Int, users: List[User]): List[(User, Int)]

class EqualSplit extends SplitStrategy:
  def label = "equal"
  def split(total: Int, users: List[User]): List[(User, Int)] =
    val base = total / users.size
    val extra = total % users.size
    // the first `extra` people pay one paisa more, so the shares always add up to the total
    users.zipWithIndex.map((u, i) => (u, base + (if i < extra then 1 else 0)))

class ExactSplit(amounts: Map[String, Int]) extends SplitStrategy:
  def label = "exact"
  def split(total: Int, users: List[User]): List[(User, Int)] =
    val shares = users.map(u => (u, amounts.getOrElse(u.id, 0)))
    val sum = shares.map(_._2).sum
    if sum != total then
      throw IllegalArgumentException(s"exact amounts add up to ${money(sum)}, not ${money(total)}")
    shares

class PercentSplit(percents: Map[String, Int]) extends SplitStrategy:
  def label = "percent"
  def split(total: Int, users: List[User]): List[(User, Int)] =
    if users.map(u => percents.getOrElse(u.id, 0)).sum != 100 then
      throw IllegalArgumentException("percentages must add up to 100")
    val shares = users.map(u => (u, total * percents.getOrElse(u.id, 0) / 100))
    val leftover = total - shares.map(_._2).sum
    // rounding leftovers go to the first person
    shares.updated(0, (shares.head._1, shares.head._2 + leftover))

case class Expense(id: Int, description: String, paidBy: User, total: Int, shares: List[(User, Int)], how: String)

// ---------- Observer: whoever cares about a new expense subscribes to the group ----------
trait ExpenseListener:
  def onExpense(expense: Expense): Unit

/** One net number per person: positive = others owe them, negative = they owe. */
class BalanceSheet extends ExpenseListener:
  private val net = LinkedHashMap.empty[User, Int]

  def onExpense(expense: Expense): Unit =
    net(expense.paidBy) = balanceOf(expense.paidBy) + expense.total
    expense.shares.foreach((user, share) => net(user) = balanceOf(user) - share)

  def balanceOf(user: User): Int = net.getOrElse(user, 0)

  /** Greedy: the biggest debtor pays the biggest creditor until everyone is at zero. */
  def settleUp(): List[(User, User, Int)] =
    val creditors = net.toArray.filter(_._2 > 0).sortBy((u, n) => (-n, u.name))
    val debtors = net.toArray.filter(_._2 < 0).map((u, n) => (u, -n)).sortBy((u, n) => (-n, u.name))
    val transfers = ListBuffer.empty[(User, User, Int)]
    var i = 0
    var j = 0
    while i < debtors.length && j < creditors.length do
      val (debtor, owes) = debtors(i)
      val (creditor, gets) = creditors(j)
      val pay = owes min gets
      transfers += ((debtor, creditor, pay))
      debtors(i) = (debtor, owes - pay)
      creditors(j) = (creditor, gets - pay)
      if owes == pay then i += 1
      if gets == pay then j += 1
    transfers.toList

class ActivityFeed extends ExpenseListener:
  private val entries = ListBuffer.empty[String]

  def onExpense(expense: Expense): Unit =
    val names = expense.shares.map((u, s) => s"${u.name} ${money(s)}").mkString(", ")
    entries += s"#${expense.id} ${expense.paidBy.name} paid ${money(expense.total)} " +
      s"for ${expense.description} (${expense.how}: $names)"

  def lines: List[String] = entries.toList

class Group(val name: String, members: List[User]):
  private val expenses = ListBuffer.empty[Expense]
  private val listeners = ListBuffer.empty[ExpenseListener]

  def subscribe(listener: ExpenseListener): Unit = listeners += listener

  def addExpense(description: String, paidBy: User, total: Int, among: List[User], strategy: SplitStrategy): Expense =
    if total <= 0 then throw IllegalArgumentException("amount must be positive")
    if !(paidBy :: among).forall(members.contains) then
      throw IllegalArgumentException("everyone in an expense must be in the group")
    val shares = strategy.split(total, among)
    val expense = Expense(expenses.size + 1, description, paidBy, total, shares, strategy.label)
    expenses += expense
    listeners.foreach(_.onExpense(expense))
    expense

  // a repayment is just an expense paid by the debtor that belongs entirely to the creditor
  def settle(debtor: User, creditor: User, amount: Int): Expense =
    addExpense("settle up", debtor, amount, List(creditor), ExactSplit(Map(creditor.id -> amount)))

@main def demo(): Unit =
  val asha = User("u1", "Asha")
  val ben = User("u2", "Ben")
  val chen = User("u3", "Chen")
  val dev = User("u4", "Dev")
  val everyone = List(asha, ben, chen, dev)
  val trip = Group("Goa trip", everyone)
  val sheet = BalanceSheet()
  val feed = ActivityFeed()
  trip.subscribe(sheet)
  trip.subscribe(feed)

  trip.addExpense("dinner", asha, 100000, List(asha, ben, chen), EqualSplit())
  trip.addExpense("cab", ben, 45000, List(asha, ben, chen), ExactSplit(Map("u1" -> 15000, "u2" -> 10000, "u3" -> 20000)))
  trip.addExpense("hotel", chen, 600000, everyone, PercentSplit(Map("u1" -> 40, "u2" -> 30, "u3" -> 20, "u4" -> 10)))
  try trip.addExpense("snacks", dev, 9000, List(ben, dev), PercentSplit(Map("u2" -> 50, "u4" -> 40)))
  catch case err: IllegalArgumentException => println(s"Rejected: ${err.getMessage}")

  feed.lines.foreach(println)
  println("Balances: " + everyone.map(u => s"${u.name} ${money(sheet.balanceOf(u))}").mkString(", "))
  val plan = sheet.settleUp()
  plan.foreach((debtor, creditor, amount) => println(s"${debtor.name} pays ${creditor.name} ${money(amount)}"))
  plan.foreach((debtor, creditor, amount) => trip.settle(debtor, creditor, amount))
  println("After settling: " + everyone.map(u => s"${u.name} ${money(sheet.balanceOf(u))}").mkString(", "))
