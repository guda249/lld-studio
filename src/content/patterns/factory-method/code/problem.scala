class EmailMessage:
  def deliver(text: String): String = s"Email: $text"

class SmsMessage:
  def deliver(text: String): String = s"SMS: ${text.take(160)}"

class OrderNotifier:
  def send(channel: String, text: String): String =
    // creation logic is tangled with the sending logic
    channel match
      case "email" => EmailMessage().deliver(text)
      case "sms"   => SmsMessage().deliver(text)
      // every new channel (push, WhatsApp...) means editing this method
      case other   => throw IllegalArgumentException(s"unknown channel: $other")

@main def factoryMethodProblem(): Unit =
  val notifier = OrderNotifier()
  println(notifier.send("email", "Your order has shipped"))
  println(notifier.send("sms", "Your order has shipped"))
  try println(notifier.send("push", "Your order has shipped"))
  catch case e: IllegalArgumentException => println(s"Failed: ${e.getMessage}")
