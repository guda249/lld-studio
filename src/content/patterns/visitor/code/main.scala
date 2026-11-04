trait ItemVisitor[R]:
  def visitBook(b: Book): R
  def visitElectronics(e: Electronics): R
  def visitGrocery(g: Grocery): R

sealed trait Item:
  def accept[R](v: ItemVisitor[R]): R

final case class Book(price: Double) extends Item:
  def accept[R](v: ItemVisitor[R]): R = v.visitBook(this)

final case class Electronics(price: Double, warrantyYears: Int) extends Item:
  def accept[R](v: ItemVisitor[R]): R = v.visitElectronics(this)

final case class Grocery(price: Double, weightKg: Double) extends Item:
  def accept[R](v: ItemVisitor[R]): R = v.visitGrocery(this)

object TaxVisitor extends ItemVisitor[Double]:          // sample rates for illustration
  def visitBook(b: Book): Double = 0
  def visitElectronics(e: Electronics): Double = e.price * 0.18
  def visitGrocery(g: Grocery): Double = g.price * 0.05

object ShippingVisitor extends ItemVisitor[Double]:
  def visitBook(b: Book): Double = 40
  def visitElectronics(e: Electronics): Double = if e.price >= 10000 then 0 else 100
  def visitGrocery(g: Grocery): Double = 20 * g.weightKg

@main def visitorDemo(): Unit =
  val cart: List[Item] = List(Book(499), Electronics(15000, 1), Grocery(300, 2.5))
  println(s"tax: ${cart.map(_.accept(TaxVisitor)).sum}")             // 2715.0
  println(s"shipping: ${cart.map(_.accept(ShippingVisitor)).sum}")   // 90.0
