case class Sale(city: String, orders: Int)

trait Formatter:
  def format(sales: List[Sale]): String

class CsvFormatter extends Formatter:
  def format(sales: List[Sale]): String =
    val lines = "city,orders" :: sales.map(s => s"${s.city},${s.orders}")
    lines.mkString("\n")

class JsonFormatter extends Formatter:
  def format(sales: List[Sale]): String =
    sales.map(s => s"""{"city": "${s.city}", "orders": ${s.orders}}""").mkString("[", ", ", "]")

abstract class ReportExporter:
  def extension: String
  protected def createFormatter(): Formatter // the factory method

  def exportReport(name: String, sales: List[Sale]): String =
    // shared steps: check, format, add a header
    if sales.isEmpty then s"$name: nothing to export"
    else
      val body = createFormatter().format(sales)
      s"== ${name}.${extension} (${sales.size} rows) ==\n$body"

class CsvExporter extends ReportExporter:
  val extension: String = "csv"
  protected def createFormatter(): Formatter = CsvFormatter()

class JsonExporter extends ReportExporter:
  val extension: String = "json"
  protected def createFormatter(): Formatter = JsonFormatter()

@main def reportExportDemo(): Unit =
  val sales = List(Sale("Pune", 120), Sale("Jaipur", 85))
  val exporters: List[ReportExporter] = List(CsvExporter(), JsonExporter())
  exporters.foreach(e => println(e.exportReport("daily-sales", sales)))
  println(CsvExporter().exportReport("empty-day", Nil))
