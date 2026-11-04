// After: the fees are data, so a Map holds them; the one rule is an if.

val Fees = Map("metro" -> 40, "town" -> 60, "remote" -> 120)
val FreeAbove = 999

def shippingFee(zone: String, total: Int): Int =
  if total > FreeAbove then 0 // the new rule: one line, one place
  else Fees(zone)

@main def patternOveruseAfter(): Unit =
  for zone <- List("metro", "town", "remote") do
    println(s"$zone ${shippingFee(zone, 800)} ${shippingFee(zone, 1200)}")
