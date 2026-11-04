// After: three classes, each with one reason to change.
import scala.collection.mutable

case class LineItem(name: String, price: BigDecimal, qty: Int)

class Invoice(val number: String, val items: List[LineItem]): // finance: prices and tax only
  def total: BigDecimal =
    val subtotal = items.map(i => i.price * i.qty).sum
    (subtotal * BigDecimal("1.18")).setScale(2, BigDecimal.RoundingMode.HALF_UP)

class InvoiceRenderer: // design: layout only
  def render(inv: Invoice): String =
    val lines = inv.items.map(i => s"${i.name} x${i.qty}")
    ((s"INVOICE ${inv.number}" :: lines) :+ s"TOTAL ${inv.total}").mkString("\n")

class InvoiceStore: // platform: storage only
  private val disk = mutable.Map.empty[String, String]
  def save(inv: Invoice): Unit = disk(inv.number) = s"""{"number": "${inv.number}", "total": ${inv.total}}"""
  def load(number: String): String = disk(number)

@main def srpAfter(): Unit =
  val inv = Invoice("INV-7", List(LineItem("Pen", 10, 3), LineItem("Notebook", 55, 2)))
  println(InvoiceRenderer().render(inv))
  val store = InvoiceStore()
  store.save(inv)
  println(store.load("INV-7"))
