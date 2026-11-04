trait Settings:
  def env: String
  def currency: String

// The one production instance: an object, created once by the language.
object ProdSettings extends Settings:
  val env: String = "prod"
  val currency: String = "INR"

class InvoiceService(val config: Settings): // the dependency is passed in
  def describe(amount: Int): String = s"[${config.env}] invoice for $amount ${config.currency}"

@main def singletonIdiomatic(): Unit =
  // Composition root: hand the one instance to everyone who needs it.
  val serviceA = InvoiceService(ProdSettings)
  val serviceB = InvoiceService(ProdSettings)
  println(serviceA.describe(1200))
  println(s"Both services share one Settings: ${serviceA.config eq serviceB.config}")

  // A test simply passes its own instance; no global to patch or reset.
  val testSettings = new Settings:
    val env: String = "test"
    val currency: String = "INR"
  println(InvoiceService(testSettings).describe(1))
