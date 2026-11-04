// After: InvoiceService asks for its Database in the constructor. main decides how many exist.
import scala.collection.mutable

class Database(val name: String):
  val rows = mutable.Map.empty[String, Int]
  def save(key: String, amount: Int): Unit = rows(key) = amount

class InvoiceService(db: Database): // the dependency is visible in the signature
  def bill(customer: String, amount: Int): String =
    db.save(customer, amount)
    s"billed $customer $amount in ${db.name}"

@main def singletonAbuseAfter(): Unit =
  val pune = Database("pune") // created once here, the "composition root"
  val mumbai = Database("mumbai") // a second branch is now just a second object
  println(InvoiceService(pune).bill("asha", 500))
  println(InvoiceService(mumbai).bill("ravi", 300))
  val testDb = Database("test") // a test gets its own fresh, empty one
  println(s"pune rows: ${pune.rows} | test rows: ${testDb.rows}")
