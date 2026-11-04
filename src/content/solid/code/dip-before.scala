// Before: the business rule builds its own database class. The arrow points down to a detail.
import scala.collection.mutable

class MySqlOrderRepository: // low-level detail
  private val rows = mutable.Map.empty[String, Int] // stands in for a real MySQL connection
  def insert(orderId: String, amount: Int): Unit =
    println(s"MySQL: INSERT INTO orders VALUES ('$orderId', $amount)")
    rows(orderId) = amount

class OrderService: // high-level business rule
  private val repo = MySqlOrderRepository() // hard-wired: can't swap, can't fake in tests
  def place(orderId: String, amount: Int): String =
    require(amount > 0, "amount must be positive")
    repo.insert(orderId, amount)
    s"order $orderId placed"

@main def dipBefore(): Unit =
  println(OrderService().place("A-101", 499)) // every run, even a unit test, talks to "MySQL"
