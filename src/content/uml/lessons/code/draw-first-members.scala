class Customer(val name: String, val email: String)   // + name, + email

class LineItem(val product: String, val price: Double, val qty: Int):
  def subtotal: Double = price * qty                   // + subtotal(): Double

class Order(val code: String):
  private var paid = false                             // - paid: Boolean

  def pay(): Unit =                                    // + pay()
    paid = true
    println(s"Order $code paid")

@main def demo(): Unit =
  println(LineItem("Book", 250.0, 2).subtotal)
  Order("A-7").pay()
