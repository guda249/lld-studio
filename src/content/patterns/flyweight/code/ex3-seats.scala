// Flyweight: fare and perks, the same for every seat in the cabin class.
final case class SeatClass(name: String, fare: Int, legroomCm: Int, perks: List[String]):
  def label(seatNo: String, booked: Boolean): String = // extrinsic state comes in as arguments
    val status = if booked then "booked" else f"₹$fare%,d"
    s"$seatNo $name ${legroomCm}cm $status"

// A fixed, pre-built pool of flyweights.
val seatClasses: Map[String, SeatClass] = Map(
  "business" -> SeatClass("Business", 24000, 110, List("lounge", "meal", "priority")),
  "stretch" -> SeatClass("Stretch", 9500, 86, List("meal")),
  "economy" -> SeatClass("Economy", 5200, 76, Nil)
)

def classFor(row: Int): SeatClass =
  if row <= 2 then seatClasses("business")
  else if row <= 5 then seatClasses("stretch")
  else seatClasses("economy")

@main def airlineSeats(): Unit =
  // The seat map only stores seat number -> (shared class, booked flag).
  val seats =
    for
      row <- 1 to 30
      letter <- "ABCDEF".toList
    yield (s"$row$letter", (classFor(row), false))
  val seatMap = seats.toMap.updated("1A", (classFor(1), true))

  val classObjects = seatMap.values.map(pair => System.identityHashCode(pair._1)).toSet.size
  println(s"${seatMap.size} seats, $classObjects seat-class objects")
  for seatNo <- List("1A", "4C", "27F") do
    val (seatClass, booked) = seatMap(seatNo)
    println(seatClass.label(seatNo, booked))
