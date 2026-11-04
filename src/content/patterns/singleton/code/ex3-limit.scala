import scala.collection.mutable

// Tracks how much each user sent today. One per app, but not a global.
class DailyLimit(val capInr: Int):
  private val spent = mutable.Map.empty[String, Int]

  def trySpend(user: String, amount: Int): Boolean =
    val used = spent.getOrElse(user, 0)
    if used + amount > capInr then false
    else
      spent(user) = used + amount
      true

class UpiTransferService(limit: DailyLimit):
  def send(user: String, amount: Int): String =
    val ok = limit.trySpend(user, amount)
    s"UPI ₹$amount for $user: ${if ok then "sent" else "blocked by daily limit"}"

class BillPayService(limit: DailyLimit):
  def pay(user: String, biller: String, amount: Int): String =
    val ok = limit.trySpend(user, amount)
    s"Bill $biller ₹$amount for $user: ${if ok then "paid" else "blocked by daily limit"}"

def buildApp(): (UpiTransferService, BillPayService) =
  val limit = DailyLimit(100000) // the one shared instance, made at startup
  (UpiTransferService(limit), BillPayService(limit))

@main def dailyLimitDemo(): Unit =
  val (upi, bills) = buildApp()
  println(upi.send("asha", 60000))
  println(bills.pay("asha", "BESCOM", 30000))
  println(upi.send("asha", 20000)) // both services see the same running total

  // A test builds its own small limit: nothing global to reset afterwards.
  val testUpi = UpiTransferService(DailyLimit(500))
  println(testUpi.send("test-user", 600))
