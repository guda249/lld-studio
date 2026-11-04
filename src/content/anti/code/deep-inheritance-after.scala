// After: Report HAS a format and a delivery; each varies on its own, no new levels.

trait Formatter:
  def render(rows: List[(String, Int)]): String

class PdfFormat extends Formatter:
  def render(rows: List[(String, Int)]): String = "[PDF] " + rows.map((n, v) => s"$n=$v").mkString("; ")

class CsvFormat extends Formatter:
  def render(rows: List[(String, Int)]): String = rows.map((n, v) => s"$n,$v").mkString("\n")

trait Delivery:
  def deliver(text: String): String

class EmailDelivery(to: String) extends Delivery:
  def deliver(text: String): String = s"mail to $to: $text"

class Report(rows: List[(String, Int)], formatter: Formatter, delivery: Delivery):
  def run(): String = delivery.deliver(formatter.render(rows))

@main def deepInheritanceAfter(): Unit =
  val rows = List(("pens", 12), ("books", 3))
  println(Report(rows, PdfFormat(), EmailDelivery("boss@shop.in")).run())
  println(Report(rows, CsvFormat(), EmailDelivery("accounts@shop.in")).run()) // the change: no new class
