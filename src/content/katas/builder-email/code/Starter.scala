// seven positional arguments: easy to swap cc and bcc, or subject and body
class Email(val sender: String, val to: List[String], val cc: List[String], val bcc: List[String],
            val subject: String, val body: String, val urgent: Boolean):
  if to.isEmpty then throw IllegalArgumentException("an email needs at least one recipient")

  def summary: String =
    val flag = if urgent then "[URGENT] " else ""
    s"$flag$subject -> to=${to.mkString(",")} cc=${cc.mkString(",")} bcc=${bcc.size} hidden"

@main def demo(): Unit =
  val welcome = Email("hr@acme.test", List("sam@acme.test"), Nil, Nil, "Welcome!", "Glad you joined.", false)
  val outage = Email("ops@acme.test", List("oncall@acme.test"), List("lead@acme.test"), List("audit@acme.test"),
    "Database down", "Failover started.", true)
  println(welcome.summary)
  println(outage.summary)
  try Email("ops@acme.test", Nil, Nil, Nil, "Nobody", "No recipients.", false)
  catch case e: IllegalArgumentException => println(s"Rejected: ${e.getMessage}")
