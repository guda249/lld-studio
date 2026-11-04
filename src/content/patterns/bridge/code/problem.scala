val sales = List("Mon" -> 1200.0, "Tue" -> 950.0)
val stock = List("Pens" -> 40.0, "Paper" -> 12.0)

class SalesCsvReport:
  def generate(): String = ("# Sales" :: sales.map((k, v) => s"$k,$v")).mkString("\n")

class SalesMarkdownReport:
  def generate(): String =
    (List("## Sales", "| item | value |", "|---|---|") ++ sales.map((k, v) => s"| $k | $v |")).mkString("\n")

class InventoryCsvReport: // CSV formatting copied a second time
  def generate(): String = ("# Inventory" :: stock.map((k, v) => s"$k,$v")).mkString("\n")

class InventoryMarkdownReport: // Markdown formatting copied a second time
  def generate(): String =
    (List("## Inventory", "| item | value |", "|---|---|") ++ stock.map((k, v) => s"| $k | $v |")).mkString("\n")

@main def bridgeProblem(): Unit =
  println(InventoryCsvReport().generate())
  val classCount = List(SalesCsvReport(), SalesMarkdownReport(), InventoryCsvReport(), InventoryMarkdownReport()).size
  println(s"2 reports x 2 formats = $classCount classes; adding PDF means 2 more, and a third report needs one class per format")
