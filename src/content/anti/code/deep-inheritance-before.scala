// Before: every new combination of format + delivery becomes another level of subclass.

class Report(val rows: List[(String, Int)]):
  def build(): String = rows.map((n, v) => s"$n=$v").mkString("; ")

class PdfReport(rs: List[(String, Int)]) extends Report(rs):
  override def build(): String = "[PDF] " + super.build()

class EmailedPdfReport(rs: List[(String, Int)]) extends PdfReport(rs):
  def send(to: String): String = s"mail to $to: ${build()}"

class ScheduledEmailedPdfReport(rs: List[(String, Int)]) extends EmailedPdfReport(rs):
  def runMonday(to: String): String = "Mon 09:00 " + send(to)

class CsvReport(rs: List[(String, Int)]) extends Report(rs):
  override def build(): String = rows.map((n, v) => s"$n,$v").mkString("\n")

class EmailedCsvReport(rs: List[(String, Int)]) extends CsvReport(rs): // send() copied
  def send(to: String): String = s"mail to $to: ${build()}"

@main def deepInheritanceBefore(): Unit =
  val rows = List(("pens", 12), ("books", 3))
  println(ScheduledEmailedPdfReport(rows).runMonday("boss@shop.in"))
  println(EmailedCsvReport(rows).send("accounts@shop.in"))
