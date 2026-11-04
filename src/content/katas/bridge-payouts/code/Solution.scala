trait PayoutRail: // implementation side: how the money moves
  def transfer(driver: String, amount: Double): String

class BankRail extends PayoutRail:
  def transfer(driver: String, amount: Double): String =
    f"bank transfer $amount%.2f to $driver's account"

class WalletRail extends PayoutRail:
  def transfer(driver: String, amount: Double): String =
    f"wallet top-up $amount%.2f for $driver"

abstract class Payout(protected val rail: PayoutRail): // abstraction side; the field is the bridge
  def send(driver: String, amount: Double): String

class InstantPayout(r: PayoutRail) extends Payout(r):
  def send(driver: String, amount: Double): String =
    val fee = BigDecimal(amount * 0.015).setScale(2, BigDecimal.RoundingMode.HALF_UP).toDouble
    f"instant (fee $fee%.2f): " + rail.transfer(driver, amount - fee)

class ScheduledPayout(r: PayoutRail) extends Payout(r):
  def send(driver: String, amount: Double): String =
    "friday batch: " + rail.transfer(driver, amount)

@main def demo(): Unit =
  val bank = BankRail()
  val wallet = WalletRail()
  println(InstantPayout(bank).send("Lena", 200.0))
  println(InstantPayout(wallet).send("Omar", 80.0))
  println(ScheduledPayout(bank).send("Lena", 640.0))
  println(ScheduledPayout(wallet).send("Omar", 150.0))
