trait ShippingStrategy:
  def cost(weightKg: Double, orderTotal: Double): Double

object StandardShipping extends ShippingStrategy:
  def cost(weightKg: Double, orderTotal: Double): Double = 40 + 10 * weightKg

object ExpressShipping extends ShippingStrategy:
  def cost(weightKg: Double, orderTotal: Double): Double = 120 + 25 * weightKg

/* Free over a threshold,
   otherwise falls back to another strategy */
class FreeAbove(threshold: Double, otherwise: ShippingStrategy) extends ShippingStrategy:
  def cost(weightKg: Double, orderTotal: Double): Double =
    if orderTotal >= threshold then 0 else otherwise.cost(weightKg, orderTotal)

final case class Order(total: Double, weightKg: Double, shipping: ShippingStrategy):
  def grandTotal: Double = total + shipping.cost(weightKg, total)

@main def shippingDemo(): Unit =
  val options: List[(String, ShippingStrategy)] = List(
    "Standard" -> StandardShipping,
    "Express" -> ExpressShipping,
    "FreeAbove(499)" -> FreeAbove(499, StandardShipping)
  )
  for (label, s) <- options do println(s"$label ${Order(650, 2, s).grandTotal}")
