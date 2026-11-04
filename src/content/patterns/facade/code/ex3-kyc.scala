class PanVerifier:
  def verify(pan: String): Boolean =
    pan.length == 10 && pan.take(5).forall(_.isLetter) && pan.slice(5, 9).forall(_.isDigit)

class AadhaarOtp:
  def check(aadhaar: String, otp: String): Boolean = otp == "123456" // the sandbox OTP

class CreditBureau:
  def score(pan: String): Int = if pan.endsWith("F") then 780 else 640

class CoreBanking:
  private var next = 5000
  def openAccount(name: String, limit: Int): String =
    next += 1
    s"SB$next"

case class OnboardingResult(ok: Boolean, detail: String)

// The mobile app makes ONE call; four vendor APIs stay behind it.
class AccountOpeningFacade:
  private val panCheck = PanVerifier()
  private val otpCheck = AadhaarOtp()
  private val bureau = CreditBureau()
  private val core = CoreBanking()

  def open(name: String, pan: String, aadhaar: String, otp: String): OnboardingResult =
    if !panCheck.verify(pan) then OnboardingResult(false, "invalid PAN")
    else if !otpCheck.check(aadhaar, otp) then OnboardingResult(false, "wrong OTP")
    else
      val limit = if bureau.score(pan) >= 750 then 200000 else 50000
      val account = core.openAccount(name, limit)
      OnboardingResult(true, f"account $account, card limit ₹$limit%,d")

@main def accountOpening(): Unit =
  val bank = AccountOpeningFacade()
  println(bank.open("Priya", "ABCDE1234F", "9999-8888-7777", "123456"))
  println(bank.open("Karan", "ABCDE1234K", "9999-8888-6666", "123456"))
  println(bank.open("Imran", "ABC123", "9999-8888-5555", "123456"))
  println(bank.open("Neha", "PQRSX5678F", "9999-8888-4444", "000000"))
