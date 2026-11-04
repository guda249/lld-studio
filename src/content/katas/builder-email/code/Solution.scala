case class Email(sender: String, to: List[String], cc: List[String], bcc: List[String],
                 subject: String, body: String, urgent: Boolean):
  def summary: String =
    val flag = if urgent then "[URGENT] " else ""
    s"$flag$subject -> to=${to.mkString(",")} cc=${cc.mkString(",")} bcc=${bcc.size} hidden"

class EmailBuilder(sender: String):
  private var toList = List.empty[String]
  private var ccList = List.empty[String]
  private var bccList = List.empty[String]
  private var subjectText = ""
  private var bodyText = ""
  private var isUrgent = false

  def to(address: String): EmailBuilder =
    toList = toList :+ address
    this

  def cc(address: String): EmailBuilder =
    ccList = ccList :+ address
    this

  def bcc(address: String): EmailBuilder =
    bccList = bccList :+ address
    this

  def subject(text: String): EmailBuilder =
    subjectText = text
    this

  def body(text: String): EmailBuilder =
    bodyText = text
    this

  def urgent(): EmailBuilder =
    isUrgent = true
    this

  def build(): Email =
    require(toList.nonEmpty, "an email needs at least one recipient")
    Email(sender, toList, ccList, bccList, subjectText, bodyText, isUrgent)

@main def demo(): Unit =
  val welcome = EmailBuilder("hr@acme.test").to("sam@acme.test").subject("Welcome!").body("Glad you joined.").build()
  val outage = EmailBuilder("ops@acme.test")
    .to("oncall@acme.test").cc("lead@acme.test").bcc("audit@acme.test")
    .subject("Database down").body("Failover started.").urgent()
    .build()
  println(welcome.summary)
  println(outage.summary)
  try EmailBuilder("ops@acme.test").subject("Nobody").body("No recipients.").build()
  catch case e: IllegalArgumentException => println(s"Rejected: ${e.getMessage.stripPrefix("requirement failed: ")}")
