import scala.math.BigDecimal.RoundingMode

trait PaymentGateway: // target, with a single abstract method
  def pay(amountInr: BigDecimal): String

class LegacyBankApi: // adaptee: third-party, cannot change
  def makeTransfer(amountPaise: Long, currencyCode: String): Map[String, String] =
    Map("status" -> "OK", "ref" -> s"TX$amountPaise$currencyCode")

// The adapter is an extension method; the lambda becomes a PaymentGateway.
extension (api: LegacyBankApi)
  def asGateway: PaymentGateway =
    amountInr => api.makeTransfer((amountInr * 100).setScale(0, RoundingMode.HALF_UP).toLong, "INR")("ref")

def completeCheckout(gateway: PaymentGateway, amountInr: BigDecimal): String =
  s"Paid, reference ${gateway.pay(amountInr)}"

@main def adapterIdiomatic(): Unit =
  val bankApi = LegacyBankApi()
  println(completeCheckout(bankApi.asGateway, BigDecimal("499.50")))
  val fake: PaymentGateway = amount => s"FAKE-$amount" // a test fake
  println(completeCheckout(fake, BigDecimal(10)))
