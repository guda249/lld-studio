// After: Account guards its own rules; services only ask it to do things.

class Account(val owner: String, private var current: Int = 0):
  private var frozen = false
  def balance: Int = current // readable, but only changed through the methods below
  def freeze(): Unit = frozen = true
  def withdraw(amount: Int): String =
    if frozen then "refused: account is frozen"
    else if amount > current then "refused: not enough money"
    else
      current -= amount
      s"ok, balance $current"

class FeeService: // thin: decides WHEN to charge; Account decides IF it may
  def chargeLateFee(account: Account): String = account.withdraw(200)

@main def anemicModelAfter(): Unit =
  val acc = Account("asha", 100)
  acc.freeze()
  println(acc.withdraw(50))
  println(s"${FeeService().chargeLateFee(acc)} | balance ${acc.balance}")
