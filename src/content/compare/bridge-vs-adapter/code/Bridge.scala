// Bridge: designed up front. Kinds of alert and ways to send them grow separately, joined by one field.

trait Channel: // implementation side: HOW a message travels
  def send(to: String, text: String): String

class SmsChannel extends Channel:
  def send(to: String, text: String): String = s"SMS to $to: $text"

class EmailChannel extends Channel:
  def send(to: String, text: String): String = s"Email to $to: $text"

// abstraction side: WHAT we tell people; the channel field is the bridge
abstract class Alert(protected val channel: Channel):
  def deliver(to: String): String

class OutageAlert(c: Channel) extends Alert(c):
  def deliver(to: String): String = channel.send(to, "Payments are down. We are on it.")

class BillReminder(c: Channel) extends Alert(c):
  def deliver(to: String): String = channel.send(to, "Your bill is due tomorrow.")

@main def bridgeVsAdapterBridge(): Unit =
  // 2 alerts + 2 channels = 4 classes, yet all 4 combinations work
  println(OutageAlert(SmsChannel()).deliver("+91-98450-11111"))
  println(OutageAlert(EmailChannel()).deliver("ops@shop.example"))
  println(BillReminder(SmsChannel()).deliver("+91-98450-22222"))
  println(BillReminder(EmailChannel()).deliver("asha@mail.example"))
