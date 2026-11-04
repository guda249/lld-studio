// A Scala `object` is a singleton: the language creates exactly one instance,
// lazily on first use, and the JVM makes that first creation thread-safe.
object AppConfig:
  var loads: Int = 0
  loads += 1
  println("Loading settings (this runs once)")
  private val settings = Map("env" -> "prod", "region" -> "ap-south-1")

  def get(key: String): String = settings(key)

class ReportService:
  def header(): String = s"Report for ${AppConfig.get("env")} in ${AppConfig.get("region")}"

class BillingService:
  def currencyFor(): String =
    if AppConfig.get("region") == "ap-south-1" then "INR" else "USD"

@main def singletonDemo(): Unit =
  println("Program started, AppConfig not created yet")
  val first = AppConfig
  val second = AppConfig
  println(s"Same instance: ${first eq second}")
  println(ReportService().header())
  println(s"Billing currency: ${BillingService().currencyFor()}")
  println(s"Settings loaded ${AppConfig.loads} time(s)")
