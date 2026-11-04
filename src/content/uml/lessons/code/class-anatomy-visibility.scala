package bank

class Account(
    val owner: String,                    // + public: anyone may use it
    private val balance: Double,          // - private: only Account
    protected val limit: Double           // # protected: Account and its subclasses
):
  private[bank] def audit(): String = s"$owner: $balance"   // ~ package: only code in package bank

class SavingsAccount(name: String, start: Double, max: Double)
    extends Account(name, start, max):
  def allows(amount: Double): Boolean = amount <= limit     // a subclass may use # members

@main def demo(): Unit =
  val acc = SavingsAccount("Asha", 5000.0, 2000.0)
  println(s"${acc.owner} ${acc.allows(1500.0)} ${acc.audit()}")   // Asha true Asha: 5000.0
