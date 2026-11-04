class SalesReport:
  println("  building report from 2 million rows (slow)...")
  val total = 4250000
  def summary(): String = f"total sales ₹$total%,d"

// A lazy val is Scala's built-in virtual proxy for one value.
class LazyReport(factory: () => SalesReport):
  private lazy val real = factory()      // runs once, on first use
  def summary(): String = real.summary()
  def total: Int = real.total

@main def proxyIdiomatic(): Unit =
  val report = LazyReport(() => SalesReport())
  println("dashboard loaded")
  println(report.summary())   // built here, on first use
  println(report.total)       // forwarded, not rebuilt
