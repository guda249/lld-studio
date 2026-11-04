trait PaymentClient:
  def pay(amount: Int): String // returns a transaction id

trait RefundClient:
  def refund(txnId: String): String

class UpiPaymentClient extends PaymentClient:
  def pay(amount: Int): String = s"UPI-$amount"

class UpiRefundClient extends RefundClient:
  def refund(txnId: String): String =
    if !txnId.startsWith("UPI-") then s"rejected $txnId: not a UPI transaction"
    else s"refunded $txnId to the payer's bank account"

class CardPaymentClient extends PaymentClient:
  def pay(amount: Int): String = s"CARD-$amount"

class CardRefundClient extends RefundClient:
  def refund(txnId: String): String =
    if !txnId.startsWith("CARD-") then s"rejected $txnId: not a card transaction"
    else s"refunded $txnId to the card in 5-7 days"

trait ProviderFactory:
  def createPaymentClient(): PaymentClient
  def createRefundClient(): RefundClient

class UpiProvider extends ProviderFactory:
  def createPaymentClient(): PaymentClient = UpiPaymentClient()
  def createRefundClient(): RefundClient = UpiRefundClient()

class CardProvider extends ProviderFactory:
  def createPaymentClient(): PaymentClient = CardPaymentClient()
  def createRefundClient(): RefundClient = CardRefundClient()

val providers: Map[String, ProviderFactory] = Map("upi" -> UpiProvider(), "card" -> CardProvider())

// unknown methods fall back to UPI, the cheapest family
def providerFor(method: String): ProviderFactory =
  providers.getOrElse(method, providers("upi"))

@main def paymentsDemo(): Unit =
  for method <- List("upi", "card", "wallet") do
    val provider = providerFor(method)
    val txn = provider.createPaymentClient().pay(750)
    println(s"$method: paid $txn, ${provider.createRefundClient().refund(txn)}")
