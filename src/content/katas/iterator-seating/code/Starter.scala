// A small cinema. rows(r)(c) is true when that seat is sold.
class SeatingPlan(val rows: Vector[Vector[Boolean]])

def label(row: Int, col: Int): String = s"${('A' + row).toChar}${col + 1}"

// Every caller walks the nested vectors itself, with its own row and column counters.
def countFree(plan: SeatingPlan): Int =
  var free = 0
  for r <- plan.rows.indices do
    for c <- plan.rows(r).indices do
      if !plan.rows(r)(c) then free += 1
  free

def firstFree(plan: SeatingPlan): String =
  var r = 0
  var found = "sold out"
  while r < plan.rows.length && found == "sold out" do
    var c = 0
    while c < plan.rows(r).length && found == "sold out" do
      if !plan.rows(r)(c) then found = label(r, c)
      c += 1
    r += 1
  found

@main def demo(): Unit =
  val plan = SeatingPlan(Vector(Vector(true, true, false), Vector(false, true), Vector(true, false, false, false)))
  println(s"free seats: ${countFree(plan)}")
  println(s"first free: ${firstFree(plan)}")
