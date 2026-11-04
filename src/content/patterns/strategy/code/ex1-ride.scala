trait PricingStrategy:
  def name: String
  def fare(km: Double, minutes: Double): Double

object NormalPricing extends PricingStrategy:
  val name = "Normal"
  def fare(km: Double, minutes: Double): Double = 50 + 12 * km + 1.5 * minutes

class SurgePricing(multiplier: Double) extends PricingStrategy:
  val name = s"Surge x$multiplier"
  def fare(km: Double, minutes: Double): Double = NormalPricing.fare(km, minutes) * multiplier

object PoolPricing extends PricingStrategy:
  val name = "Pool"
  def fare(km: Double, minutes: Double): Double = NormalPricing.fare(km, minutes) * 0.7

class Ride(pricing: PricingStrategy):
  def quote(km: Double, minutes: Double): String = f"₹${pricing.fare(km, minutes)}%.0f"

@main def rideDemo(): Unit =
  for p <- List(NormalPricing, SurgePricing(1.8), PoolPricing) do
    println(s"${p.name}: ${Ride(p).quote(8, 25)}")
