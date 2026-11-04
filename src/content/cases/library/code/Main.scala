import scala.collection.mutable.{ArrayBuffer, LinkedHashMap, Queue}

case class Book(isbn: String, title: String, author: String)

enum CopyStatus(val label: String):
  case Available extends CopyStatus("available")
  case OnHold extends CopyStatus("on hold")
  case Borrowed extends CopyStatus("borrowed")
  case Lost extends CopyStatus("lost")

/** One physical copy on the shelf. Many copies share one Book. */
class BookCopy(val copyId: String, val book: Book):
  var status: CopyStatus = CopyStatus.Available
  var heldFor: Option[String] = None // member id while OnHold

// ---------- Strategy: each membership plan has its own limits and fine rule ----------
trait MembershipPlan:
  def maxLoans: Int
  def loanDays: Int
  def fineFor(daysLate: Int): Int

class StandardPlan extends MembershipPlan:
  def maxLoans = 3
  def loanDays = 14
  def fineFor(daysLate: Int): Int = 10 * daysLate

class StudentPlan extends MembershipPlan:
  def maxLoans = 5
  def loanDays = 21
  def fineFor(daysLate: Int): Int = (5 * daysLate) min 100 // students never pay more than ₹100 per book

class Member(val memberId: String, val name: String, val plan: MembershipPlan):
  var finesDue = 0

class Loan(val copy: BookCopy, val member: Member, val dueDay: Int):
  var returnedDay: Option[Int] = None

class Catalog:
  private val books = ArrayBuffer.empty[Book]
  private val copies = ArrayBuffer.empty[BookCopy]

  def add(book: Book, count: Int): Unit =
    books += book
    val start = copies.size
    for n <- 0 until count do copies += BookCopy(s"C${start + n + 1}", book)

  def search(text: String): List[Book] =
    val t = text.toLowerCase
    books.filter(b => b.title.toLowerCase.contains(t) || b.author.toLowerCase.contains(t)).toList

  def copiesOf(isbn: String): List[BookCopy] = copies.filter(_.book.isbn == isbn).toList

// ---------- Observer: notices go to whoever listens (SMS, e-mail, a board at the desk) ----------
trait LibraryListener:
  def onNotice(member: Member, message: String): Unit

class NoticeBoard extends LibraryListener:
  val notices = ArrayBuffer.empty[String]
  def onNotice(member: Member, message: String): Unit = notices += s"to ${member.name}: $message"

// ---------- Facade: the desk clerk only talks to Library ----------
class Library:
  val LostFee = 500
  val catalog = Catalog()
  private val loans = ArrayBuffer.empty[Loan]
  private val holds = LinkedHashMap.empty[String, Queue[Member]]
  private val listeners = ArrayBuffer.empty[LibraryListener]

  def subscribe(listener: LibraryListener): Unit = listeners += listener

  private def tell(member: Member, message: String): Unit = listeners.foreach(_.onNotice(member, message))

  private def openLoan(copyId: String): Loan =
    loans.find(l => l.copy.copyId == copyId && l.returnedDay.isEmpty)
      .getOrElse(throw IllegalArgumentException(s"$copyId is not on loan"))

  def borrow(member: Member, isbn: String, today: Int): Loan =
    if member.finesDue > 0 then throw IllegalArgumentException(s"${member.name} owes ₹${member.finesDue}; pay first")
    if loans.count(l => l.member == member && l.returnedDay.isEmpty) >= member.plan.maxLoans then
      throw IllegalArgumentException(s"${member.name} already has ${member.plan.maxLoans} books")
    val copies = catalog.copiesOf(isbn)
    val mine = copies.filter(c => c.status == CopyStatus.OnHold && c.heldFor.contains(member.memberId))
    val free = copies.filter(_.status == CopyStatus.Available)
    val copy = (mine ++ free).headOption
      .getOrElse(throw IllegalArgumentException("no copy free for you; reserve it instead"))
    copy.status = CopyStatus.Borrowed
    copy.heldFor = None
    val loan = Loan(copy, member, today + member.plan.loanDays)
    loans += loan
    loan

  def reserve(member: Member, isbn: String): Int =
    if catalog.copiesOf(isbn).exists(_.status == CopyStatus.Available) then
      throw IllegalArgumentException("a copy is on the shelf; borrow it instead")
    val queue = holds.getOrElseUpdate(isbn, Queue.empty[Member])
    queue.enqueue(member)
    queue.size

  def returnCopy(copyId: String, today: Int): Int =
    val loan = openLoan(copyId)
    loan.returnedDay = Some(today)
    val fine = loan.member.plan.fineFor((today - loan.dueDay) max 0)
    if fine > 0 then
      loan.member.finesDue += fine
      tell(loan.member, s"returned '${loan.copy.book.title}' late, fine ₹$fine")
    holds.get(loan.copy.book.isbn).filter(_.nonEmpty) match
      case Some(queue) =>
        val next = queue.dequeue()
        loan.copy.status = CopyStatus.OnHold
        loan.copy.heldFor = Some(next.memberId)
        tell(next, s"'${loan.copy.book.title}' is waiting for you at the desk")
      case None =>
        loan.copy.status = CopyStatus.Available
    fine

  def reportLost(copyId: String, today: Int): Unit =
    val loan = openLoan(copyId)
    loan.returnedDay = Some(today)
    loan.copy.status = CopyStatus.Lost
    loan.member.finesDue += LostFee
    tell(loan.member, s"'${loan.copy.book.title}' marked lost, fee ₹$LostFee")

  def pay(member: Member, amount: Int): Unit = member.finesDue = (member.finesDue - amount) max 0

def attempt(label: String)(action: => Any): Unit =
  try println(s"$label -> $action")
  catch case err: IllegalArgumentException => println(s"$label -> refused: ${err.getMessage}")

@main def demo(): Unit =
  val library = Library()
  val board = NoticeBoard()
  library.subscribe(board)
  library.catalog.add(Book("111", "Clean Code", "Robert Martin"), 1)
  library.catalog.add(Book("222", "Design Patterns", "Gamma et al."), 2)
  library.catalog.add(Book("333", "Refactoring", "Martin Fowler"), 1)
  val ravi = Member("m1", "Ravi", StandardPlan())
  val meera = Member("m2", "Meera", StudentPlan())

  println("Search 'martin': " + library.catalog.search("martin").map(_.title).mkString("[", ", ", "]"))
  attempt("Day 1  Ravi borrows Clean Code")(s"due day ${library.borrow(ravi, "111", 1).dueDay}")
  attempt("Day 2  Meera borrows Clean Code")(library.borrow(meera, "111", 2))
  attempt("Day 2  Meera reserves Clean Code")(s"place ${library.reserve(meera, "111")} in queue")
  attempt("Day 20 Ravi returns C1")(s"fine ₹${library.returnCopy("C1", 20)}")
  attempt("Day 20 Ravi borrows Refactoring")(library.borrow(ravi, "333", 20))
  library.pay(ravi, 50)
  attempt("Day 20 Ravi pays, borrows Refactoring")(s"due day ${library.borrow(ravi, "333", 20).dueDay}")
  attempt("Day 21 Ravi borrows Clean Code")(library.borrow(ravi, "111", 21))
  attempt("Day 21 Meera borrows Clean Code")(s"due day ${library.borrow(meera, "111", 21).dueDay}")
  attempt("Day 22 Meera borrows Design Patterns")(s"due day ${library.borrow(meera, "222", 22).dueDay}")
  library.reportLost("C2", 60)
  val copies = List("111", "222", "333").flatMap(library.catalog.copiesOf)
  println("Copies: " + copies.map(c => s"${c.copyId} ${c.status.label}").mkString(", "))
  println("Fines due: " + List(ravi, meera).map(m => s"${m.name} ₹${m.finesDue}").mkString(", "))
  board.notices.foreach(n => println(s"Notice $n"))
