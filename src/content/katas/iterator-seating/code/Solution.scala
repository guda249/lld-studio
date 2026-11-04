case class Seat(label: String, sold: Boolean)

// A small cinema. rows(r)(c) is true when that seat is sold. Only this class knows that layout.
class SeatingPlan(val rows: Vector[Vector[Boolean]]) extends Iterable[Seat]:
  def iterator: Iterator[Seat] = SeatIterator(this) // a fresh walk every time

// Walks the seats row by row and remembers where it is.
class SeatIterator(plan: SeatingPlan) extends Iterator[Seat]:
  private val rows = plan.rows
  private var row = 0
  private var col = 0

  private def skipFinishedRows(): Unit =
    while row < rows.length && col >= rows(row).length do
      row += 1 // end of this row: move to the next one
      col = 0

  def hasNext: Boolean =
    skipFinishedRows()
    row < rows.length

  def next(): Seat =
    if !hasNext then throw java.util.NoSuchElementException("no more seats")
    val seat = Seat(s"${('A' + row).toChar}${col + 1}", rows(row)(col))
    col += 1
    seat

// Callers use a plain for loop or collection methods and never see rows or columns.
def countFree(plan: SeatingPlan): Int = plan.count(seat => !seat.sold)

def firstFree(plan: SeatingPlan): String =
  plan.find(seat => !seat.sold).map(_.label).getOrElse("sold out")

@main def demo(): Unit =
  val plan = SeatingPlan(Vector(Vector(true, true, false), Vector(false, true), Vector(true, false, false, false)))
  println(s"free seats: ${countFree(plan)}")
  println(s"first free: ${firstFree(plan)}")
