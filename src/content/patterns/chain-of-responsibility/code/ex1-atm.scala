import scala.collection.mutable

// Handler: pays out as many notes of its size as it can, then passes the rest on.
class NoteDispenser(val note: Int, next: Option[NoteDispenser] = None):
  def dispense(amount: Int, notes: mutable.LinkedHashMap[Int, Int]): Int =
    val count = amount / note
    if count > 0 then notes(note) = count
    val rest = amount % note
    next match
      case Some(n) if rest > 0 => n.dispense(rest, notes)
      case _                   => rest // whatever is left could not be paid

class Atm:
  private val chain = NoteDispenser(2000, Some(NoteDispenser(500, Some(NoteDispenser(100)))))

  def withdraw(amount: Int): String =
    val notes = mutable.LinkedHashMap.empty[Int, Int]
    val left = chain.dispense(amount, notes)
    if left > 0 then s"₹$amount: cannot dispense, use multiples of ₹100"
    else
      val parts = notes.toList.map((note, count) => s"$count x ₹$note").mkString(", ")
      s"₹$amount: $parts"

@main def atmDemo(): Unit =
  val atm = Atm()
  for amount <- List(5600, 2000, 700, 450) do
    println(atm.withdraw(amount))
