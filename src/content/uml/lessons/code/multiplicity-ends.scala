import scala.collection.mutable.ListBuffer

class Customer(val name: String):
  val orders = ListBuffer[Order]()        // read at the Order end: 0..* Orders

class Order(val id: String, val customer: Customer):   // read at the Customer end: exactly 1
  customer.orders += this

@main def demo(): Unit =
  val asha = Customer("Asha")
  println(asha.orders.size)               // 0: no orders yet is allowed
  Order("A-1", asha)
  Order("A-2", asha)
  println(s"${asha.orders.map(_.id)} -> ${asha.orders.head.customer.name}")
