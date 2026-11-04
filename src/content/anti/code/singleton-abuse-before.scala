// Before: every class reaches for the one global Database object.
import scala.collection.mutable

object Database: // a Scala object is a singleton
  val rows = mutable.Map.empty[String, Int]
  def save(key: String, amount: Int): Unit = rows(key) = amount

class InvoiceService:
  def bill(customer: String, amount: Int): String =
    Database.save(customer, amount) // hidden dependency
    s"billed $customer $amount"

@main def singletonAbuseBefore(): Unit =
  println(InvoiceService().bill("asha", 500))
  // a "test" elsewhere sees asha's row too: state leaks between callers
  println(s"rows seen by everyone: ${Database.rows}")
