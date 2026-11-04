import scala.collection.mutable

trait SmsGateway:
  def sendOtp(phone: String, now: Int): String

// The real vendor charges ₹0.20 per SMS.
class VendorSmsGateway extends SmsGateway:
  var sent = 0
  def sendOtp(phone: String, now: Int): String =
    sent += 1
    s"OTP sent to $phone"

// Protection proxy: at most `limit` OTPs per phone in any `window` seconds.
class RateLimitedSms(real: SmsGateway, limit: Int, window: Int) extends SmsGateway:
  private val history = mutable.Map.empty[String, List[Int]]

  def sendOtp(phone: String, now: Int): String =
    val recent = history.getOrElse(phone, Nil).filter(t => now - t < window)
    if recent.size >= limit then
      history(phone) = recent
      s"blocked $phone: try after ${recent.head + window - now}s"
    else
      history(phone) = recent :+ now
      real.sendOtp(phone, now)

@main def otpRateLimit(): Unit =
  val vendor = VendorSmsGateway()
  val sms: SmsGateway = RateLimitedSms(vendor, limit = 3, window = 60)
  for second <- List(0, 5, 10, 15, 70) do      // a fake clock, so the demo never sleeps
    println(f"t=$second%2ds  ${sms.sendOtp("+91-98450-12345", second)}")
  println(s"t=20s  ${sms.sendOtp("+91-99000-55555", 20)}")
  println(f"vendor billed for ${vendor.sent} SMS = ₹${vendor.sent * 0.20}%.2f")
