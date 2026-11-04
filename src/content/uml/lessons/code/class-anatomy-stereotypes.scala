trait PaymentMethod:                      // «interface»: only promises
  def pay(amount: Double): String

abstract class BasePayment extends PaymentMethod:   // «abstract»: shared code, can't be created
  def pay(amount: Double): String = s"${label()} paid $amount"
  protected def label(): String

enum CardType(val text: String):          // «enumeration»: a fixed list of values
  case Visa extends CardType("Visa")
  case RuPay extends CardType("RuPay")

class Card(kind: CardType) extends BasePayment:
  protected def label(): String = s"${kind.text} card"

@main def demo(): Unit =
  val method: PaymentMethod = Card(CardType.RuPay)
  println(method.pay(250.0))              // RuPay card paid 250.0
