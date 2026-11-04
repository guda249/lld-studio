// Works out what a driver owes. The pricing rule is picked with if/else on a plan name.
class ParkingMeter(plan: String):
  def fee(hours: Int): Double =
    if plan == "hourly" then 2.5 * hours
    else if plan == "day-pass" then 12.0 * math.max((hours + 23) / 24, 1)
    else if plan == "resident" then (if hours <= 2 then 0.0 else 1.0 * (hours - 2))
    else throw IllegalArgumentException(s"unknown plan $plan")

@main def demo(): Unit =
  for plan <- List("hourly", "day-pass", "resident") do
    val meter = ParkingMeter(plan)
    println(f"$plan%-9s 3h: ${meter.fee(3)}%5.2f   30h: ${meter.fee(30)}%6.2f")
