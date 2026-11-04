class ShopApp:
  def logIn(): Unit = println("Logged in")

  def applyCoupon(code: String): Unit = println(s"Coupon $code applied")

  def placeOrder(coupon: Option[String] = None): Unit =
    logIn()                            // «include»: always happens
    coupon.foreach(applyCoupon)        // «extend»: only sometimes
    println("Order placed")

@main def demo(): Unit =
  val app = ShopApp()
  app.placeOrder()
  app.placeOrder(Some("SAVE10"))
