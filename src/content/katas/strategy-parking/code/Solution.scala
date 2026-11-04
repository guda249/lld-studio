trait RatePlan:
  def fee(hours: Int): Double

class Hourly extends RatePlan:
  def fee(hours: Int): Double = 2.5 * hours

class DayPass extends RatePlan:
  def fee(hours: Int): Double = 12.0 * math.max((hours + 23) / 24, 1)

class Resident extends RatePlan:
  def fee(hours: Int): Double = if hours <= 2 then 0.0 else 1.0 * (hours - 2)

// Works out what a driver owes by asking its rate plan. It never names a concrete plan.
class ParkingMeter(private var plan: RatePlan):
  def setPlan(newPlan: RatePlan): Unit = plan = newPlan
  def fee(hours: Int): Double = plan.fee(hours)

@main def demo(): Unit =
  val plans = List("hourly" -> Hourly(), "day-pass" -> DayPass(), "resident" -> Resident())
  for (name, plan) <- plans do
    val meter = ParkingMeter(plan)
    println(f"$name%-9s 3h: ${meter.fee(3)}%5.2f   30h: ${meter.fee(30)}%6.2f")
