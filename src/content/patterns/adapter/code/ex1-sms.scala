trait SmsSender: // target: what our OTP code expects
  def send(phone: String, text: String): Boolean

class QuickSmsClient(val healthy: Boolean): // vendor SDK 1 (cannot change)
  def sendMessage(to: String, body: String): Map[String, String] =
    Map("state" -> (if healthy then "queued" else "error"))

class BharatTelClient: // vendor SDK 2: numbers without +91, returns a status code
  def dispatch(numbers: List[String], message: String, priority: Int): Int =
    if numbers.forall(_.length == 10) then 200 else 400

class QuickSmsAdapter(client: QuickSmsClient) extends SmsSender:
  def send(phone: String, text: String): Boolean =
    client.sendMessage(to = phone, body = text)("state") == "queued"

class BharatTelAdapter(client: BharatTelClient) extends SmsSender:
  def send(phone: String, text: String): Boolean =
    val local = phone.stripPrefix("+91") // translate our format into theirs
    client.dispatch(List(local), text, priority = 1) == 200

class FallbackSender(senders: List[(String, SmsSender)]) extends SmsSender: // tries each in turn
  def send(phone: String, text: String): Boolean =
    senders.exists(entry => trySender(entry._1, entry._2, phone, text)) // stops at the first success

  private def trySender(name: String, sender: SmsSender, phone: String, text: String): Boolean =
    val ok = sender.send(phone, text)
    println(if ok then s"  sent via $name" else s"  $name failed, trying next")
    ok

def sendOtp(sender: SmsSender, phone: String, code: String): Unit =
  val ok = sender.send(phone, s"Your OTP is $code")
  println(s"OTP to $phone: ${if ok then "delivered" else "not delivered"}")

@main def smsAdapterDemo(): Unit =
  sendOtp(QuickSmsAdapter(QuickSmsClient(healthy = true)), "+919812345678", "482913")
  val fallback = FallbackSender(List(
    "QuickSms" -> QuickSmsAdapter(QuickSmsClient(healthy = false)),
    "BharatTel" -> BharatTelAdapter(BharatTelClient())
  ))
  sendOtp(fallback, "+919812345678", "771204")
