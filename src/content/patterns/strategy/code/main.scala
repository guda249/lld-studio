trait PaymentMethod:
  def pay(amount: BigDecimal): String

class CardPayment extends PaymentMethod:
  def pay(amount: BigDecimal) = s"Paid ₹$amount by card"

class UpiPayment extends PaymentMethod:
  def pay(amount: BigDecimal) = s"Paid ₹$amount via UPI"

class WalletPayment extends PaymentMethod:
  def pay(amount: BigDecimal) = s"Paid ₹$amount from wallet"

class Checkout(private var method: PaymentMethod):
  def setMethod(m: PaymentMethod): Unit = method = m
  def pay(amount: BigDecimal): String = method.pay(amount)

class PayLaterPayment extends PaymentMethod:  // new: nothing above changes
  def pay(amount: BigDecimal) = s"Paid ₹$amount with PayLater"

@main def strategyDemo(): Unit =
  val checkout = Checkout(CardPayment())
  println(checkout.pay(1200))
  checkout.setMethod(UpiPayment())
  println(checkout.pay(1200))
  checkout.setMethod(PayLaterPayment())
  println(checkout.pay(1200))
