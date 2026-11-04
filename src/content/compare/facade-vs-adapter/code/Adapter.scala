// Adapter: Checkout already expects a Shipper. The courier's one SDK class has a different interface.

trait Shipper: // target: the interface Checkout was written against
  def ship(orderId: String, weightKg: Double, pincode: String): String

class QuickCourierClient: // adaptee: the courier's SDK class; we can't change it
  def createConsignment(ref: String, grams: Int, pin: Int): Map[String, String] =
    Map("awb" -> s"QC$pin-$grams", "etaDays" -> "2")

class QuickCourierAdapter(client: QuickCourierClient) extends Shipper: // adapter
  def ship(orderId: String, weightKg: Double, pincode: String): String =
    // translate: kilograms to grams, text pincode to a number, ship to createConsignment
    val grams = math.round(weightKg * 1000).toInt
    val reply = client.createConsignment(orderId, grams, pincode.toInt)
    // translate the reply back into what Checkout expects
    s"$orderId: tracking ${reply("awb")}, ${reply("etaDays")} days"

class Checkout(shipper: Shipper): // client: only knows Shipper
  def complete(orderId: String, weightKg: Double, pincode: String): String =
    "Order placed. " + shipper.ship(orderId, weightKg, pincode)

@main def facadeVsAdapterAdapter(): Unit =
  val checkout = Checkout(QuickCourierAdapter(QuickCourierClient()))
  println(checkout.complete("A101", 1.2, "560001"))
  println(checkout.complete("A102", 0.4, "700019"))
