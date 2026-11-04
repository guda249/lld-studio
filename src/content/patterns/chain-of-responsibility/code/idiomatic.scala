// Each partial function handles only the amounts it is defined for.
val teamLead: PartialFunction[Int, String] = { case a if a <= 10_000 => "TeamLead approved" }
val manager: PartialFunction[Int, String] = { case a if a <= 100_000 => "Manager approved" }
val director: PartialFunction[Int, String] = { case a if a <= 1_000_000 => "Director approved" }
val board: PartialFunction[Int, String] = { case _ => "Rejected" }

// orElse links them: the first one defined for the amount wins.
val approveAll: PartialFunction[Int, String] =
  teamLead.orElse(manager).orElse(director).orElse(board)

@main def idiomaticChain(): Unit =
  for amount <- List(4_000, 75_000, 600_000, 5_000_000) do
    println(s"₹$amount: ${approveAll(amount)}")
