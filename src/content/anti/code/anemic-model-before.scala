// Before: Account is only data; the rules live in a manager, and anyone can skip them.

class Account(val owner: String, var balance: Int = 0, var frozen: Boolean = false)

class AccountManager:
  def withdraw(account: Account, amount: Int): String =
    if account.frozen then "refused: account is frozen"
    else if amount > account.balance then "refused: not enough money"
    else
      account.balance -= amount
      s"ok, balance ${account.balance}"

class FeeService: // written later by another team; it never saw the rules
  def chargeLateFee(account: Account): Unit = account.balance -= 200

@main def anemicModelBefore(): Unit =
  val acc = Account("asha", balance = 100, frozen = true)
  println(AccountManager().withdraw(acc, 50))
  FeeService().chargeLateFee(acc)
  println(s"frozen account still lost money: ${acc.balance}")
