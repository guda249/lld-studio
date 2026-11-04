trait Message:
  def deliver(text: String): String

class EmailMessage extends Message:
  def deliver(text: String): String = s"Email: $text"

class SmsMessage extends Message:
  def deliver(text: String): String = s"SMS: ${text.take(160)}"

abstract class Notifier:
  protected def createMessage(): Message // the factory method

  def send(text: String): String = // business logic, never changes
    val message = createMessage()
    message.deliver(text)

class EmailNotifier extends Notifier:
  protected def createMessage(): Message = EmailMessage()

class SmsNotifier extends Notifier:
  protected def createMessage(): Message = SmsMessage()

@main def factoryMethodDemo(): Unit =
  val notifiers: List[Notifier] = List(EmailNotifier(), SmsNotifier())
  notifiers.foreach(n => println(n.send("Your order has shipped")))
