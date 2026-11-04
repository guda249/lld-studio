// After: a new channel is a new class. NotificationService never changes.

trait Notifier:
  def send(user: String, text: String): String

class EmailNotifier extends Notifier:
  def send(user: String, text: String): String = s"email to $user@shop.example: $text"

class SmsNotifier extends Notifier:
  def send(user: String, text: String): String = s"sms to $user: ${text.take(160)}"

class WhatsAppNotifier extends Notifier: // the new request: one new class, nothing else edited
  def send(user: String, text: String): String = s"whatsapp to $user: $text"

class NotificationService(notifiers: List[Notifier]): // closed: works with any Notifier
  def broadcast(user: String, text: String): List[String] =
    notifiers.map(_.send(user, text))

@main def ocpAfter(): Unit =
  val service = NotificationService(List(EmailNotifier(), SmsNotifier(), WhatsAppNotifier()))
  service.broadcast("asha", "Your order has shipped").foreach(println)
