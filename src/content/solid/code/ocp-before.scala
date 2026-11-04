// Before: every new channel means opening this class and adding another case.

class NotificationService:
  def send(channel: String, user: String, text: String): String =
    channel match
      case "email" => s"email to $user@shop.example: $text"
      case "sms"   => s"sms to $user: ${text.take(160)}" // SMS has a length limit
      case "push"  => s"push to $user's phone: ${text.take(60)}"
      case other   => throw IllegalArgumentException(s"unknown channel $other")

@main def ocpBefore(): Unit =
  val service = NotificationService()
  for channel <- List("email", "sms", "push") do
    println(service.send(channel, "asha", "Your order has shipped"))
  try service.send("whatsapp", "asha", "Hi") // the new request: not supported yet
  catch case e: IllegalArgumentException => println(s"error: ${e.getMessage}")
