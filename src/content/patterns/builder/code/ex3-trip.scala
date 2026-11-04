import java.time.LocalDate

final case class Trip(
    origin: String,
    destination: String,
    depart: LocalDate,
    returnOn: Option[LocalDate],
    travellers: Int
)

// an immutable builder: every step returns a new builder, so drafts can be shared safely
final case class TripBuilder(
    origin: String = "",
    destination: String = "",
    depart: Option[LocalDate] = None,
    returnOn: Option[LocalDate] = None,
    travellers: Int = 1
):
  def route(from: String, to: String): TripBuilder = copy(origin = from, destination = to)
  def on(day: LocalDate): TripBuilder = copy(depart = Some(day))
  def returning(day: LocalDate): TripBuilder = copy(returnOn = Some(day))
  def forPeople(n: Int): TripBuilder = copy(travellers = n)

  def build(): Trip =
    val day = depart.getOrElse(throw IllegalArgumentException("route and departure date are required"))
    if origin.isEmpty then throw IllegalArgumentException("route and departure date are required")
    if returnOn.exists(_.isBefore(day)) then throw IllegalArgumentException("return date is before departure")
    Trip(origin, destination, day, returnOn, travellers)

@main def tripDemo(): Unit =
  val draft = TripBuilder().route("Delhi", "Goa").on(LocalDate.of(2026, 12, 20)).forPeople(2)
  val oneWay = draft.build()
  val roundTrip = draft.returning(LocalDate.of(2026, 12, 27)).build() // draft itself is unchanged

  for trip <- List(oneWay, roundTrip) do
    val back = trip.returnOn.map(_.toString).getOrElse("one way")
    println(s"${trip.origin} -> ${trip.destination}, ${trip.depart}, back: $back, ${trip.travellers} people")

  try draft.returning(LocalDate.of(2026, 12, 1)).build()
  catch case e: IllegalArgumentException => println(s"Rejected: ${e.getMessage}")
