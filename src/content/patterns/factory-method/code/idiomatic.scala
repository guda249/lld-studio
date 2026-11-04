trait Message:
  def deliver(text: String): String

class EmailMessage extends Message:
  def deliver(text: String): String = s"Email: $text"

class SmsMessage extends Message:
  def deliver(text: String): String = s"SMS: ${text.take(160)}"

// the "factory method" is just a function handed in
class Notifier(makeMessage: () => Message):
  def send(text: String): String = makeMessage().deliver(text)

@main def factoryMethodIdiomatic(): Unit =
  val notifiers = List(Notifier(() => EmailMessage()), Notifier(() => SmsMessage()))
  notifiers.foreach(n => println(n.send("Your order has shipped")))
