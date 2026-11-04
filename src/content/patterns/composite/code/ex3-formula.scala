type Cells = Map[String, Double]

sealed trait Expr: // component
  def evaluate(cells: Cells): Double
  def show: String

final case class Num(value: Double) extends Expr: // leaf
  def evaluate(cells: Cells): Double = value
  def show: String = value.toString

final case class Ref(cell: String) extends Expr: // leaf: points at another cell
  def evaluate(cells: Cells): Double = cells(cell)
  def show: String = cell

final case class Add(left: Expr, right: Expr) extends Expr: // composite with two children
  def evaluate(cells: Cells): Double = left.evaluate(cells) + right.evaluate(cells)
  def show: String = s"(${left.show} + ${right.show})"

final case class Mul(left: Expr, right: Expr) extends Expr: // composite with two children
  def evaluate(cells: Cells): Double = left.evaluate(cells) * right.evaluate(cells)
  def show: String = s"${left.show} * ${right.show}"

final case class Sum(items: List[Expr]) extends Expr: // composite with any number of children
  def evaluate(cells: Cells): Double = items.map(_.evaluate(cells)).sum
  def show: String = items.map(_.show).mkString("SUM(", ", ", ")")

@main def formulaCompositeDemo(): Unit =
  // Invoice total with GST: SUM(qty * price for each line) * (1 + gst rate)
  val total = Mul(Sum(List(Mul(Ref("B2"), Ref("C2")), Mul(Ref("B3"), Ref("C3")))), Add(Num(1.0), Ref("D1")))
  val cells: Cells = Map("B2" -> 2.0, "C2" -> 450.0, "B3" -> 1.0, "C3" -> 1200.0, "D1" -> 0.18)

  println(s"Formula: =${total.show}")
  println(f"Total: ₹${total.evaluate(cells)}%.2f")
  println(f"A single cell is an Expr too: C3 = ${Ref("C3").evaluate(cells)}%.2f")
  println(f"After changing B2 to 3: ₹${total.evaluate(cells.updated("B2", 3.0))}%.2f")
