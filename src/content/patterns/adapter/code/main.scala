import scala.math.BigDecimal.RoundingMode

trait PaymentGateway: // target: what our code expects
  def pay(amountInr: BigDecimal): String

class LegacyBankApi: // adaptee: third-party, cannot change
  def makeTransfer(amountPaise: Long, currencyCode: String): Map[String, String] =
    Map("status" -> "OK", "ref" -> s"TX$amountPaise$currencyCode")

class LegacyBankAdapter(api: LegacyBankApi) extends PaymentGateway: // adapter
  def pay(amountInr: BigDecimal): String =
    val paise = (amountInr * 100).setScale(0, RoundingMode.HALF_UP).toLong
    val response = api.makeTransfer(paise, "INR")
    if response("status") != "OK" then throw RuntimeException("payment failed")
    response("ref")

class Checkout(gateway: PaymentGateway): // client: only knows PaymentGateway
  def complete(amountInr: BigDecimal): String =
    s"Paid ₹$amountInr, reference ${gateway.pay(amountInr)}"

@main def adapterDemo(): Unit =
  val checkout = Checkout(LegacyBankAdapter(LegacyBankApi()))
  println(checkout.complete(BigDecimal("499.50")))
  println(checkout.complete(BigDecimal("199")))
