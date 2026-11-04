final case class Customer(name: String, phone: String, email: String)

trait Channel: // implementation side: how a message travels
  def deliver(customer: Customer, subject: String, body: String): String

class SmsChannel extends Channel:
  def deliver(customer: Customer, subject: String, body: String): String =
    s"SMS to ${customer.phone}: $body"

class EmailChannel extends Channel:
  def deliver(customer: Customer, subject: String, body: String): String =
    s"Email to ${customer.email} [$subject] Dear ${customer.name}, $body"

class PushChannel extends Channel:
  def deliver(customer: Customer, subject: String, body: String): String =
    s"Push to ${customer.name}'s phone: $subject"

abstract class Notification(protected val channel: Channel): // abstraction side; the field is the bridge
  def send(customer: Customer): String

class TransactionAlert(ch: Channel, amount: Int, merchant: String) extends Notification(ch):
  def send(customer: Customer): String =
    val body = f"₹$amount%,d spent at $merchant. Not you? Call 1800-123-456"
    channel.deliver(customer, "Debit alert", body)

class StatementReady(ch: Channel, month: String) extends Notification(ch):
  def send(customer: Customer): String =
    channel.deliver(customer, s"$month statement", "your statement is ready to download.")

@main def notifyBridgeDemo(): Unit =
  val meera = Customer("Meera", "+919900112233", "meera@example.com")
  println(TransactionAlert(SmsChannel(), 4999, "Croma, Pune").send(meera))
  println(TransactionAlert(PushChannel(), 4999, "Croma, Pune").send(meera))
  println(StatementReady(EmailChannel(), "October").send(meera))
  println("2 message types x 3 channels = 6 combinations from 5 classes")
