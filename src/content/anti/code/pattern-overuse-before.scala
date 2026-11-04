// Before: a trait, three classes and a factory to look up a number per zone.

trait ShippingFeeStrategy:
  def fee(total: Int): Int

class MetroFee extends ShippingFeeStrategy:
  def fee(total: Int): Int = 40

class TownFee extends ShippingFeeStrategy:
  def fee(total: Int): Int = 60

class RemoteFee extends ShippingFeeStrategy:
  def fee(total: Int): Int = 120

class ShippingFeeFactory: // "in case we add plugins later" (nobody has)
  private val registry: Map[String, () => ShippingFeeStrategy] =
    Map("metro" -> (() => MetroFee()), "town" -> (() => TownFee()), "remote" -> (() => RemoteFee()))
  def create(zone: String): ShippingFeeStrategy = registry(zone)()

@main def patternOveruseBefore(): Unit =
  val factory = ShippingFeeFactory()
  for zone <- List("metro", "town", "remote") do
    println(s"$zone ${factory.create(zone).fee(800)}")
