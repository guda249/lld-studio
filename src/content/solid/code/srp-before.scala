// Before: one class answers to finance, design and the platform team.
import scala.collection.mutable

case class LineItem(name: String, price: BigDecimal, qty: Int)

class Invoice(val number: String, val items: List[LineItem]):
  def total: BigDecimal = // finance: prices and tax
    val subtotal = items.map(i => i.price * i.qty).sum
    (subtotal * BigDecimal("1.18")).setScale(2, BigDecimal.RoundingMode.HALF_UP) // 18% GST

  def render(): String = // design: how the invoice looks
    val lines = items.map(i => s"${i.name} x${i.qty}")
    ((s"INVOICE $number" :: lines) :+ s"TOTAL $total").mkString("\n")

  def save(disk: mutable.Map[String, String]): Unit = // platform: where invoices live
    disk(number) = s"""{"number": "$number", "total": $total}"""

@main def srpBefore(): Unit =
  val disk = mutable.Map.empty[String, String]
  val inv = Invoice("INV-7", List(LineItem("Pen", 10, 3), LineItem("Notebook", 55, 2)))
  println(inv.render())
  inv.save(disk)
  println(disk)
