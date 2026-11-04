case class Order(item: String, qty: Int, pincode: String, upiId: String)

val stock: Map[String, Int] = Map("kurta" -> 5, "saree" -> 0)

// Handler: on success it forwards the order, on failure it stops the chain.
abstract class Check:
  private var next: Option[Check] = None
  def name: String
  def check(order: Order): Option[String]

  def link(other: Check): Check =
    next = Some(other)
    other

  def validate(order: Order): String =
    check(order) match
      case Some(error) => s"Rejected by $name: $error"
      case None =>
        next match
          case Some(n) => n.validate(order)
          case None    => "Order placed"

class StockCheck extends Check:
  val name = "StockCheck"
  def check(order: Order): Option[String] =
    val left = stock.getOrElse(order.item, 0)
    if left < order.qty then Some(s"only $left ${order.item} left") else None

class PincodeCheck extends Check:
  val name = "PincodeCheck"
  def check(order: Order): Option[String] =
    val ok = order.pincode.length == 6 && order.pincode.forall(_.isDigit)
    if ok then None else Some(s"bad pincode ${order.pincode}")

class PaymentCheck extends Check:
  val name = "PaymentCheck"
  def check(order: Order): Option[String] =
    if order.upiId.contains("@") then None else Some(s"bad UPI id ${order.upiId}")

def buildChain(checks: List[Check]): Check =
  checks.zip(checks.tail).foreach((a, b) => a.link(b))
  checks.head

@main def checkoutDemo(): Unit =
  val chain = buildChain(List(StockCheck(), PincodeCheck(), PaymentCheck()))
  println(chain.validate(Order("kurta", 2, "560001", "asha@okbank")))
  println(chain.validate(Order("saree", 1, "560001", "asha@okbank")))
  println(chain.validate(Order("kurta", 1, "5600", "asha@okbank")))
  println(chain.validate(Order("kurta", 1, "400050", "ravi-upi")))
