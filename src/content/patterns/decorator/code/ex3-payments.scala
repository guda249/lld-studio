trait PaymentGateway:
  def pay(user: String, amount: Int): String

class UpiGateway extends PaymentGateway:
  private var nextRef = 1000
  def pay(user: String, amount: Int): String =
    nextRef += 1
    s"UPI-$nextRef"

// Stackable traits: "abstract override" means "wrap whatever pay() comes before me".
trait Audited extends PaymentGateway:
  abstract override def pay(user: String, amount: Int): String =
    val ref = super.pay(user, amount)
    println(s"AUDIT $user paid ₹$amount ref=$ref")
    ref

trait Metered extends PaymentGateway:
  var calls = 0
  var volume = 0
  abstract override def pay(user: String, amount: Int): String =
    calls += 1
    volume += amount
    super.pay(user, amount)

@main def stackedPayments(): Unit =
  val plain = UpiGateway()
  println(s"plain: ${plain.pay("test-user", 1)}")

  // Rightmost trait runs first: Audited -> Metered -> UpiGateway
  val gateway = new UpiGateway with Metered with Audited
  gateway.pay("asha", 499)
  gateway.pay("ravi", 1200)
  println(s"metrics: ${gateway.calls} payments, ₹${gateway.volume} total")
