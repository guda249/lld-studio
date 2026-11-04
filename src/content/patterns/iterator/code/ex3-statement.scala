case class Txn(day: Int, source: String, detail: String, amount: Int)

class Feed(source: String, rows: List[(Int, String, Int)]): // aggregate: one sorted source
  private val txns = rows.map((day, detail, amount) => Txn(day, source, detail, amount))
  def iterator: Iterator[Txn] = txns.iterator

// Iterator built from two iterators: always yields the earlier item.
class MergedStatement(left: Iterator[Txn], right: Iterator[Txn]) extends Iterator[Txn]:
  private var a: Option[Txn] = left.nextOption() // one item of look-ahead each
  private var b: Option[Txn] = right.nextOption()

  def hasNext: Boolean = a.isDefined || b.isDefined

  def next(): Txn =
    val takeLeft = (a, b) match
      case (Some(x), Some(y)) => x.day <= y.day
      case (Some(_), None)    => true
      case (None, Some(_))    => false
      case (None, None)       => throw java.util.NoSuchElementException("statement finished")
    if takeLeft then
      val txn = a.get
      a = left.nextOption()
      txn
    else
      val txn = b.get
      b = right.nextOption()
      txn

@main def statementDemo(): Unit =
  val upi = Feed("UPI", List((1, "Swiggy", -350), (4, "Salary", 85000), (9, "Rent", -22000)))
  val card = Feed("Card", List((2, "Amazon", -1299), (4, "Fuel", -2000), (12, "Netflix", -649)))

  var balance = 10000
  for t <- MergedStatement(upi.iterator, card.iterator) do
    balance += t.amount
    println(f"day ${t.day}%2d  ${t.source}%-4s  ${t.detail}%-7s ${t.amount}%+7d  balance ${balance}%6d")
