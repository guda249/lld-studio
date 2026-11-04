// The middle step: when each zone needs its own rule (not just a number), a Map of functions.

def metro(total: Int): Int = if total > 499 then 0 else 40

def remote(total: Int): Int = 120 + total / 100 // a surcharge that grows with the order

val FeeRules: Map[String, Int => Int] = Map("metro" -> metro, "town" -> (_ => 60), "remote" -> remote)

@main def patternOveruseMiddle(): Unit =
  for (zone, rule) <- FeeRules do println(s"$zone ${rule(800)}")
