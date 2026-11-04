class Customer:
  def placeOrder(shop: Shop): Unit =              // Customer lane
    println("Customer: place order")
    shop.acceptOrder()

  def receiveParcel(): Unit =                     // Customer lane
    println("Customer: receive parcel")

class Shop:
  def acceptOrder(): Unit =                       // Shop lane
    println("Shop: accept order")

  def packAndShip(customer: Customer): Unit =     // Shop lane
    println("Shop: pack and ship")
    customer.receiveParcel()

@main def demo(): Unit =
  val asha = Customer()
  val shop = Shop()
  asha.placeOrder(shop)
  shop.packAndShip(asha)
