// The system boundary: everything inside is one use case.
class ShopApp:
  def browseProducts(): Unit = println("Showing products")
  def placeOrder(): Unit = println("Order placed")
  def trackOrder(): Unit = println("Order is on its way")
  def addProduct(): Unit = println("Product added")

@main def demo(): Unit =
  val app = ShopApp()
  // actor: Customer
  app.browseProducts()
  app.placeOrder()
  app.trackOrder()
  // actor: Admin
  app.addProduct()
