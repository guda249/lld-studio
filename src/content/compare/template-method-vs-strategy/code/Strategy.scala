// Strategy: the exporter keeps the order of steps and asks a format object, passed in, for each step.

type Row = (String, Int)

trait RowFormat: // strategy: every step a format must provide
  def header(): String
  def formatRow(name: String, amount: Int): String
  def footer(count: Int): String

class CsvFormat extends RowFormat:
  def header(): String = "item,amount"
  def formatRow(name: String, amount: Int): String = s"$name,$amount"
  def footer(count: Int): String = s"$count rows"

class MarkdownFormat extends RowFormat:
  def header(): String = "| item | amount |\n|---|---|"
  def formatRow(name: String, amount: Int): String = s"| $name | $amount |"
  def footer(count: Int): String = s"_${count} rows_"

// context: holds a format and can switch it at runtime
class ReportExporter(private var fmt: RowFormat):
  def setFormat(f: RowFormat): Unit = fmt = f

  def exportReport(rows: List[Row]): String =
    val body = rows.map((name, amount) => fmt.formatRow(name, amount))
    (fmt.header() :: body ::: List(fmt.footer(rows.size))).mkString("\n")

@main def templateVsStrategyStrategy(): Unit =
  val rows = List("Pens" -> 1200, "Paper" -> 950)
  val exporter = ReportExporter(CsvFormat())
  println(exporter.exportReport(rows))
  exporter.setFormat(MarkdownFormat()) // same exporter object, new format
  println(exporter.exportReport(rows))
