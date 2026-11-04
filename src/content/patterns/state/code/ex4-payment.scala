import scala.collection.mutable

enum Pay:
  case Created, Pending, Success, Failed, Refunded

  def label: String = toString.toLowerCase

// (state, event) -> next state; the table is the single source of truth
val table: Map[(Pay, String), Pay] = Map(
  (Pay.Created, "send") -> Pay.Pending,
  (Pay.Pending, "bank_ok") -> Pay.Success,
  (Pay.Pending, "bank_declined") -> Pay.Failed,
  (Pay.Pending, "timeout") -> Pay.Failed,
  (Pay.Failed, "retry") -> Pay.Pending,
  (Pay.Success, "refund") -> Pay.Refunded
)

val onEnter: Map[Pay, String] = Map(                 // side effects when a state is entered
  Pay.Success -> "send receipt to payer",
  Pay.Failed -> "show 'payment failed, try again'",
  Pay.Refunded -> "credit money back to the source account"
)

class UpiPayment(val txnId: String, val amount: Int): // context driven by the table
  var state: Pay = Pay.Created
  val history = mutable.ListBuffer(state.label)

  def handle(event: String): Unit =
    table.get((state, event)) match
      case None => println(f"$event%-14s ignored in ${state.label}")
      case Some(nxt) =>
        state = nxt
        history += nxt.label
        val action = onEnter.getOrElse(nxt, "")
        println(f"$event%-14s -> ${nxt.label}%-9s $action".trim)

@main def paymentDemo(): Unit =
  val payment = UpiPayment("UPI-88213", 1250)
  println(f"${payment.txnId}: paying ₹${payment.amount}%,d")
  for event <- List("send", "timeout", "refund", "retry", "bank_ok", "refund") do
    payment.handle(event)
  println(s"History: ${payment.history.mkString(" > ")}")
