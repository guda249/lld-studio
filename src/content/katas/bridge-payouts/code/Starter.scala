// One class per (payout speed x payment rail) pair. A third rail (UPI) would add two more
// classes, and a third speed would add one per rail: the count multiplies.

class InstantBankPayout:
  def send(driver: String, amount: Double): String =
    val fee = BigDecimal(amount * 0.015).setScale(2, BigDecimal.RoundingMode.HALF_UP).toDouble
    f"instant (fee $fee%.2f): bank transfer ${amount - fee}%.2f to $driver's account"

class InstantWalletPayout:
  def send(driver: String, amount: Double): String =
    val fee = BigDecimal(amount * 0.015).setScale(2, BigDecimal.RoundingMode.HALF_UP).toDouble // copied
    f"instant (fee $fee%.2f): wallet top-up ${amount - fee}%.2f for $driver"

class ScheduledBankPayout:
  def send(driver: String, amount: Double): String =
    f"friday batch: bank transfer $amount%.2f to $driver's account"

class ScheduledWalletPayout:
  def send(driver: String, amount: Double): String =
    // the wallet text is copied from InstantWalletPayout
    f"friday batch: wallet top-up $amount%.2f for $driver"

@main def demo(): Unit =
  println(InstantBankPayout().send("Lena", 200.0))
  println(InstantWalletPayout().send("Omar", 80.0))
  println(ScheduledBankPayout().send("Lena", 640.0))
  println(ScheduledWalletPayout().send("Omar", 150.0))
