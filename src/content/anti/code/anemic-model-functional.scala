// Also fine: immutable data + the functions that own its rules, kept side by side.

case class Account(owner: String, balance: Int, frozen: Boolean = false)

object Account: // the companion object is the one place the rules live
  def withdraw(acc: Account, amount: Int): Either[String, Account] =
    if acc.frozen then Left("refused: account is frozen")
    else if amount > acc.balance then Left("refused: not enough money")
    else Right(acc.copy(balance = acc.balance - amount)) // a new value; the old one is untouched

@main def anemicModelFunctional(): Unit =
  val acc = Account("asha", 100)
  println(Account.withdraw(acc, 30))
  println(Account.withdraw(acc.copy(frozen = true), 30))
