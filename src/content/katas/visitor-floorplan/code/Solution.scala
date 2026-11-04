// One operation over the floor plan; one visit method per kind of space.
trait SpaceVisitor[R]:
  def visitRoom(room: Room): R
  def visitCorridor(corridor: Corridor): R
  def visitStaircase(stairs: Staircase): R

sealed trait Space:
  def accept[R](visitor: SpaceVisitor[R]): R

case class Room(width: Double, length: Double) extends Space:
  def accept[R](visitor: SpaceVisitor[R]): R = visitor.visitRoom(this)

case class Corridor(length: Double) extends Space:
  def accept[R](visitor: SpaceVisitor[R]): R = visitor.visitCorridor(this)

case class Staircase(flights: Int) extends Space:
  def accept[R](visitor: SpaceVisitor[R]): R = visitor.visitStaircase(this)

object AreaVisitor extends SpaceVisitor[Double]:
  def visitRoom(room: Room): Double = room.width * room.length
  def visitCorridor(corridor: Corridor): Double = corridor.length * 2.0 // corridors are 2 m wide
  def visitStaircase(stairs: Staircase): Double = 6.0 * stairs.flights

object CleaningVisitor extends SpaceVisitor[Double]:
  def visitRoom(room: Room): Double = room.width * room.length * 1.5
  def visitCorridor(corridor: Corridor): Double = corridor.length * 0.5 // a quick mop along the length
  def visitStaircase(stairs: Staircase): Double = 10.0 * stairs.flights

@main def demo(): Unit =
  val floor: List[Space] = List(Room(4, 5), Room(3, 3), Corridor(12), Staircase(2))
  println(s"area m2: ${floor.map(_.accept(AreaVisitor)).sum}")
  println(s"cleaning min: ${floor.map(_.accept(CleaningVisitor)).sum}")
