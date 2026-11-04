type Rows = List[(String, Double)]
type Render = (String, Rows) => String // the implementation side is one function

def toCsv(title: String, rows: Rows): String =
  (s"# $title" :: rows.map((k, v) => s"$k,$v")).mkString("\n")

def toPlain(title: String, rows: Rows): String =
  s"$title: " + rows.map((k, v) => s"$k=$v").mkString(", ")

class SalesReport(render: Render): // the bridge is now a function field
  def generate(): String = render("Sales", List("Mon" -> 1200.0, "Tue" -> 950.0))

@main def bridgeIdiomatic(): Unit =
  println(SalesReport(toCsv).generate())
  println(SalesReport(toPlain).generate())
