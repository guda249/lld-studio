// Template Method: the base class fixes the order of steps; each subclass fills in its own steps.

type Row = (String, Int)

abstract class ReportExporter:
  final def exportReport(rows: List[Row]): String = // the template method: the order lives here
    val body = rows.map((name, amount) => formatRow(name, amount))
    (header() :: body ::: List(footer(rows.size))).mkString("\n")

  protected def header(): String
  protected def formatRow(name: String, amount: Int): String
  protected def footer(count: Int): String = s"$count rows" // hook: a default subclasses may replace

class CsvExporter extends ReportExporter:
  protected def header(): String = "item,amount"
  protected def formatRow(name: String, amount: Int): String = s"$name,$amount"

class MarkdownExporter extends ReportExporter:
  protected def header(): String = "| item | amount |\n|---|---|"
  protected def formatRow(name: String, amount: Int): String = s"| $name | $amount |"
  override protected def footer(count: Int): String = s"_${count} rows_"

@main def templateVsStrategyTemplate(): Unit =
  val rows = List("Pens" -> 1200, "Paper" -> 950)
  println(CsvExporter().exportReport(rows))
  println(MarkdownExporter().exportReport(rows))
