import scala.collection.mutable

enum Direction:
  case Up, Down, Idle

/** A hall call: someone on `floor` pressed the up or down button. */
case class Request(floor: Int, direction: Direction)

/** State: each state decides what one tick means and which state comes next. */
trait ElevatorState:
  def step(elevator: Elevator): Unit
  def direction: Direction
  def label: String

class IdleState extends ElevatorState:
  def step(elevator: Elevator): Unit =
    if elevator.stops.isEmpty then ()                 // nothing to do: stay idle
    else if elevator.stops.contains(elevator.floor) then
      elevator.stops -= elevator.floor
      elevator.setState(DoorsOpenState(Direction.Idle))
    else if elevator.hasStopsAbove then elevator.setState(MovingUpState())
    else elevator.setState(MovingDownState())

  def direction: Direction = Direction.Idle
  def label: String = "Idle"

class MovingUpState extends ElevatorState:
  def step(elevator: Elevator): Unit =
    elevator.floor += 1
    if elevator.stops.contains(elevator.floor) then
      elevator.stops -= elevator.floor
      elevator.setState(DoorsOpenState(Direction.Up))

  def direction: Direction = Direction.Up
  def label: String = "MovingUp"

class MovingDownState extends ElevatorState:
  def step(elevator: Elevator): Unit =
    elevator.floor -= 1
    if elevator.stops.contains(elevator.floor) then
      elevator.stops -= elevator.floor
      elevator.setState(DoorsOpenState(Direction.Down))

  def direction: Direction = Direction.Down
  def label: String = "MovingDown"

/** Doors stay open for one tick, then close. Keep going the same way while stops remain that way. */
class DoorsOpenState(val going: Direction) extends ElevatorState:
  def step(elevator: Elevator): Unit =
    elevator.stops -= elevator.floor                  // a call here is served by these open doors
    val up = elevator.hasStopsAbove
    val down = elevator.hasStopsBelow
    if up && (going != Direction.Down || !down) then elevator.setState(MovingUpState())
    else if down then elevator.setState(MovingDownState())
    else elevator.setState(IdleState())

  def direction: Direction = going
  def label: String = "DoorsOpen"

class Elevator(val name: String, var floor: Int):
  val stops: mutable.Set[Int] = mutable.Set()
  private var state: ElevatorState = IdleState()
  private var tick = 0

  def setState(next: ElevatorState): Unit =
    println(f"t=$tick%2d  $name: ${state.label} -> ${next.label} at floor $floor")
    state = next

  def direction: Direction = state.direction
  def addStop(floor: Int): Unit = stops += floor
  def hasStopsAbove: Boolean = stops.exists(_ > floor)
  def hasStopsBelow: Boolean = stops.exists(_ < floor)

  def isResting: Boolean = stops.isEmpty && state.isInstanceOf[IdleState]

  def step(now: Int): Unit =
    tick = now
    state.step(this)

/** Strategy: which elevator answers a hall call. */
trait DispatchStrategy:
  def choose(elevators: Vector[Elevator], request: Request): Elevator

/** Closest car that is idle or already heading towards the caller in the same direction. */
class NearestCarStrategy extends DispatchStrategy:
  private val penalty = 10

  def cost(e: Elevator, request: Request): Int =
    val distance = (e.floor - request.floor).abs
    e.direction match
      case Direction.Idle => distance
      case Direction.Up if request.direction == Direction.Up && request.floor >= e.floor => distance
      case Direction.Down if request.direction == Direction.Down && request.floor <= e.floor => distance
      case _ => distance + penalty

  def choose(elevators: Vector[Elevator], request: Request): Elevator =
    elevators.minBy(e => (cost(e, request), e.name))

/** Facade: the building's buttons talk to this one object. */
class ElevatorController(elevators: Vector[Elevator], strategy: DispatchStrategy, topFloor: Int):
  var tick = 0

  private def check(floor: Int): Unit =
    if floor < 0 || floor > topFloor then throw IllegalArgumentException(s"no floor $floor")

  def hallCall(request: Request): Elevator =
    check(request.floor)
    val car = strategy.choose(elevators, request)
    car.addStop(request.floor)
    println(f"t=$tick%2d  call at ${request.floor} (${request.direction.toString.toLowerCase}) -> ${car.name}")
    car

  def carCall(name: String, floor: Int): Unit =
    check(floor)
    elevators.find(_.name == name).get.addStop(floor)
    println(f"t=$tick%2d  inside $name: pressed $floor")

  def step(): Unit =
    tick += 1
    elevators.foreach(_.step(tick))

  def allResting: Boolean = elevators.forall(_.isResting)

@main def demo(): Unit =
  val a = Elevator("A", 0)
  val b = Elevator("B", 8)
  val building = ElevatorController(Vector(a, b), NearestCarStrategy(), topFloor = 9)

  building.hallCall(Request(5, Direction.Down)) // B is closer
  building.hallCall(Request(2, Direction.Up))   // A is closer
  val script: Map[Int, () => Unit] = Map(
    3 -> (() => building.carCall("A", 7)),
    4 -> (() => { building.carCall("B", 0); building.hallCall(Request(6, Direction.Up)); () })
  )
  var done = false
  while !done && building.tick < 30 do
    building.step()
    script.get(building.tick).foreach(action => action())
    done = building.allResting
  println(s"done at t=${building.tick}: A at ${a.floor}, B at ${b.floor}")
