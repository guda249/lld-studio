// A class is a blueprint. An object is one thing built from that blueprint.

class BankAccount(val owner: String): // val: public and read-only
  private var balanceValue = 0 // private: only this class can change it

  def deposit(amount: Int): Unit =
    require(amount > 0, "deposit must be positive")
    balanceValue += amount

  def withdraw(amount: Int): Unit =
    require(amount <= balanceValue, "not enough money") // the class guards its own rule
    balanceValue -= amount

  def balance: Int = balanceValue

@main def oopBasicsAccount(): Unit =
  val asha = BankAccount("Asha") // two objects from one class,
  val ravi = BankAccount("Ravi") // each with its own balance
  asha.deposit(500)
  asha.withdraw(120)
  ravi.deposit(50)
  println(s"${asha.owner} ${asha.balance}") // Asha 380
  println(s"${ravi.owner} ${ravi.balance}") // Ravi 50
  try ravi.withdraw(999)
  catch case e: IllegalArgumentException => println(s"refused: ${e.getMessage}")
