import scala.collection.mutable.ListBuffer

trait LateFee:
  def charge(daysLate: Int): Double

class FlatLateFee extends LateFee:
  def charge(daysLate: Int): Double = 5.0 * daysLate

class Member(val name: String)

class Book(val title: String)

class DueDate(val days: Int)

class Loan(val member: Member):
  val books: ListBuffer[Book] = ListBuffer()
  val due = DueDate(14)

  def borrow(book: Book): Unit =
    books += book

  def fine(daysKept: Int, fee: LateFee): Double =
    val late = math.max(0, daysKept - due.days)
    fee.charge(late) * books.size

@main def demo(): Unit =
  val loan = Loan(Member("Ravi"))
  loan.borrow(Book("Dune"))
  loan.borrow(Book("Emma"))
  println(s"${loan.member.name} owes ${loan.fine(17, FlatLateFee())}")
