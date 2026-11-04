class LegacyBankApi: // third-party SDK we cannot edit
  def makeTransfer(amountPaise: Long, currencyCode: String): Map[String, String] =
    Map("status" -> "OK", "ref" -> s"TX$amountPaise$currencyCode")

val bank = LegacyBankApi()

def checkout(amountInr: BigDecimal): String =
  val response = bank.makeTransfer((amountInr * 100).toLong, "INR") // SDK units leak in here
  s"Order paid, ref ${response("ref")}"

def walletTopUp(amountInr: BigDecimal): String =
  val response = bank.makeTransfer((amountInr * 100).toLong, "INR") // ...and here, copied
  s"Wallet topped up, ref ${response("ref")}"

def subscription(amountInr: BigDecimal): String =
  val response = bank.makeTransfer(amountInr.toLong, "INR") // forgot the x100: 1/100th charged
  s"Subscription paid, ref ${response("ref")}"

@main def adapterProblem(): Unit =
  println(checkout(BigDecimal("499.50")))
  println(walletTopUp(BigDecimal("1000")))
  println(subscription(BigDecimal("199")))
  println("Three call sites know the SDK's paise and dict format; a new bank means editing all three")
