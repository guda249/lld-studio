// Every operation on the floor plan is a method here, so every space class must implement it.
sealed trait Space:
  def area: Double
  def cleaningMinutes: Double

case class Room(width: Double, length: Double) extends Space:
  def area: Double = width * length
  def cleaningMinutes: Double = area * 1.5

case class Corridor(length: Double) extends Space:
  def area: Double = length * 2.0             // corridors are 2 m wide
  def cleaningMinutes: Double = length * 0.5  // a quick mop along the length

case class Staircase(flights: Int) extends Space:
  def area: Double = 6.0 * flights
  def cleaningMinutes: Double = 10.0 * flights

@main def demo(): Unit =
  val floor: List[Space] = List(Room(4, 5), Room(3, 3), Corridor(12), Staircase(2))
  println(s"area m2: ${floor.map(_.area).sum}")
  println(s"cleaning min: ${floor.map(_.cleaningMinutes).sum}")
