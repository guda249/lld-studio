// Facade: the courier's SDK has several classes. One class runs the whole flow for us.

class RateCard:
  def price(grams: Int, pincode: String): Int =
    val farAway = if pincode.startsWith("7") then 20 else 0
    40 + (grams / 500) * 15 + farAway

class LabelPrinter:
  def printLabel(orderId: String, pincode: String): String = s"LBL-$orderId-$pincode"

class PickupScheduler:
  def bookPickup(label: String): String = s"pickup of $label booked"

// One simple call. It only coordinates; the SDK classes do the work.
class ShippingFacade(rates: RateCard, labels: LabelPrinter, pickups: PickupScheduler):
  def ship(orderId: String, weightKg: Double, pincode: String): String =
    val grams = math.round(weightKg * 1000).toInt
    val cost = rates.price(grams, pincode)
    val label = labels.printLabel(orderId, pincode)
    val pickup = pickups.bookPickup(label)
    s"$orderId: ₹$cost, $pickup"

class Checkout(shipping: ShippingFacade): // client: makes one call instead of three
  def complete(orderId: String, weightKg: Double, pincode: String): String =
    "Order placed. " + shipping.ship(orderId, weightKg, pincode)

@main def facadeVsAdapterFacade(): Unit =
  val checkout = Checkout(ShippingFacade(RateCard(), LabelPrinter(), PickupScheduler()))
  println(checkout.complete("A101", 1.2, "560001"))
  println(checkout.complete("A102", 0.4, "700019"))
