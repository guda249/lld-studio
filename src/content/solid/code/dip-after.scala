// After: the business layer owns the interface it needs; details implement it.
import scala.collection.mutable

trait OrderRepository: // abstraction, owned by the business side
  def save(orderId: String, amount: Int): Unit
  def find(orderId: String): Option[Int]

class OrderService(repo: OrderRepository): // high-level: knows only the abstraction
  def place(orderId: String, amount: Int): String =
    require(amount > 0, "amount must be positive")
    repo.save(orderId, amount)
    s"order $orderId placed"

class MySqlOrderRepository extends OrderRepository: // detail for production
  private val rows = mutable.Map.empty[String, Int]
  def save(orderId: String, amount: Int): Unit =
    println(s"MySQL: INSERT INTO orders VALUES ('$orderId', $amount)")
    rows(orderId) = amount
  def find(orderId: String): Option[Int] = rows.get(orderId)

class InMemoryOrderRepository extends OrderRepository: // detail for tests: no database needed
  private val rows = mutable.Map.empty[String, Int]
  def save(orderId: String, amount: Int): Unit = rows(orderId) = amount
  def find(orderId: String): Option[Int] = rows.get(orderId)

@main def dipAfter(): Unit =
  // the composition root: the one place that picks concrete classes
  println(OrderService(MySqlOrderRepository()).place("A-101", 499))
  val fake = InMemoryOrderRepository()
  println(s"${OrderService(fake).place("T-1", 10)} | test sees ${fake.find("T-1")}")
