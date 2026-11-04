import scala.collection.mutable

enum VehicleSize(val rank: Int):
  case Small extends VehicleSize(1)   // motorbike
  case Medium extends VehicleSize(2)  // car
  case Large extends VehicleSize(3)   // van, bus

case class Vehicle(plate: String, size: VehicleSize)

class ParkingSpot(val spotId: String, val size: VehicleSize):
  var vehicle: Option[Vehicle] = None

  def isFree: Boolean = vehicle.isEmpty

  // a spot takes any vehicle that is the same size or smaller
  def fits(v: Vehicle): Boolean = isFree && v.size.rank <= size.rank

  def assign(v: Vehicle): Unit = vehicle = Some(v)

  def release(): Unit = vehicle = None

class Level(val number: Int, val spots: Vector[ParkingSpot]):
  def freeCount: Int = spots.count(_.isFree)

case class Ticket(ticketId: String, vehicle: Vehicle, spot: ParkingSpot, entryMinute: Int)

/** Strategy: how to pick a spot. Swap it without touching ParkingLot. */
trait SpotFinder:
  def find(levels: Vector[Level], vehicle: Vehicle): Option[ParkingSpot]

/** Lowest level first, then the smallest spot that fits (keeps big spots for big vehicles). */
class NearestFinder extends SpotFinder:
  def find(levels: Vector[Level], vehicle: Vehicle): Option[ParkingSpot] =
    levels.iterator
      .map(level => level.spots.filter(_.fits(vehicle)))
      .find(_.nonEmpty)
      .map(fitting => fitting.minBy(_.size.rank))

/** Strategy: how to charge. Weekend or event pricing is a new class, not an edit. */
trait FeePolicy:
  def fee(ticket: Ticket, exitMinute: Int): Int

class HourlyFee extends FeePolicy:
  private val rates = Map(VehicleSize.Small -> 10, VehicleSize.Medium -> 20, VehicleSize.Large -> 40)

  def fee(ticket: Ticket, exitMinute: Int): Int =
    val minutes = exitMinute - ticket.entryMinute
    if minutes <= 15 then 0                // short grace period
    else
      val hours = (minutes + 59) / 60      // every started hour counts
      hours * rates(ticket.vehicle.size)

/** Observer: anything that wants to hear when free spots change. */
trait LotObserver:
  def onChange(level: Int, free: Int): Unit

class DisplayBoard(val name: String) extends LotObserver:
  def onChange(level: Int, free: Int): Unit =
    println(s"  [$name] level $level: $free free")

/** Facade: the one entry point the gates call (park / leave). */
class ParkingLot(levels: Vector[Level], finder: SpotFinder, fees: FeePolicy):
  private val observers = mutable.ArrayBuffer[LotObserver]()
  private val active = mutable.LinkedHashMap[String, Ticket]()
  private var nextId = 1

  def subscribe(observer: LotObserver): Unit = observers += observer

  private def announce(spot: ParkingSpot): Unit =
    val level = levels.find(_.spots.contains(spot)).get
    observers.foreach(_.onChange(level.number, level.freeCount))

  def park(vehicle: Vehicle, minute: Int): Option[Ticket] =
    if active.values.exists(_.vehicle.plate == vehicle.plate) then
      throw IllegalArgumentException(s"${vehicle.plate} is already parked")
    finder.find(levels, vehicle).map { spot =>
      spot.assign(vehicle)
      val ticket = Ticket(s"T$nextId", vehicle, spot, minute)
      nextId += 1
      active(ticket.ticketId) = ticket
      announce(spot)
      ticket
    }

  def leave(ticketId: String, minute: Int): Int =
    val ticket = active.remove(ticketId).getOrElse(throw java.util.NoSuchElementException(s"unknown ticket $ticketId"))
    val amount = fees.fee(ticket, minute)
    ticket.spot.release()
    announce(ticket.spot)
    amount

def buildLevel(number: Int, small: Int, medium: Int, large: Int): Level =
  val sizes = Vector.fill(small)(VehicleSize.Small) ++ Vector.fill(medium)(VehicleSize.Medium) ++ Vector.fill(large)(VehicleSize.Large)
  Level(number, sizes.zipWithIndex.map((s, i) => ParkingSpot(f"L$number-${i + 1}%02d", s)))

@main def demo(): Unit =
  val lot = ParkingLot(Vector(buildLevel(1, 1, 2, 0), buildLevel(2, 0, 0, 1)), NearestFinder(), HourlyFee())
  lot.subscribe(DisplayBoard("Gate A"))

  val bike = Vehicle("KA-01-B-1", VehicleSize.Small)
  val car1 = Vehicle("KA-02-C-7", VehicleSize.Medium)
  val car2 = Vehicle("KA-03-C-9", VehicleSize.Medium)
  val van = Vehicle("KA-04-V-2", VehicleSize.Large)

  val tickets = mutable.ArrayBuffer[Ticket]()
  for (v, minute) <- List(bike -> 540, car1 -> 545, car2 -> 550, van -> 560) do
    lot.park(v, minute).foreach { t =>
      tickets += t
      println(s"${v.plate} -> ${t.spot.spotId} (${t.ticketId})")
    }

  val car3 = Vehicle("KA-05-C-4", VehicleSize.Medium)
  println(s"${car3.plate} -> ${lot.park(car3, 600).fold("no spot")(_ => "parked")}")

  println(s"${car1.plate} pays ${lot.leave(tickets(1).ticketId, 545 + 130)}") // 2h10m -> 3 hours
  println(s"${bike.plate} pays ${lot.leave(tickets(0).ticketId, 550)}")       // 10 min -> free
  val t3 = lot.park(car3, 700)
  println(s"${car3.plate} -> ${t3.fold("no spot")(_.spot.spotId)}")
