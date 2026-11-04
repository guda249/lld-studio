type Rows = List[(String, Double)]

trait Renderer: // implementation side: how output looks
  def render(title: String, rows: Rows): String

class CsvRenderer extends Renderer:
  def render(title: String, rows: Rows): String =
    (s"# $title" :: rows.map((k, v) => s"$k,$v")).mkString("\n")

class MarkdownRenderer extends Renderer:
  def render(title: String, rows: Rows): String =
    (List(s"## $title", "| item | value |", "|---|---|") ++
      rows.map((k, v) => s"| $k | $v |")).mkString("\n")

abstract class Report(protected val renderer: Renderer): // abstraction side; the field is the bridge
  def generate(): String

class SalesReport(r: Renderer) extends Report(r):
  def generate(): String = renderer.render("Sales", List("Mon" -> 1200.0, "Tue" -> 950.0))

class InventoryReport(r: Renderer) extends Report(r):
  def generate(): String = renderer.render("Inventory", List("Pens" -> 40.0, "Paper" -> 12.0))

@main def bridgeDemo(): Unit =
  println(SalesReport(MarkdownRenderer()).generate())
  println(InventoryReport(CsvRenderer()).generate())
