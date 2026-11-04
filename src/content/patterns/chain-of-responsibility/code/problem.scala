// Every approval rule lives in one function.
// Adding a "Finance check" or a different order for one department
// means editing this function again and again.
def approve(amount: Int): String =
  if amount <= 10_000 then "TeamLead"
  else if amount <= 100_000 then "Manager"
  else if amount <= 1_000_000 then "Director"
  else "Rejected"

@main def approvalProblem(): Unit =
  for amount <- List(4_000, 75_000, 600_000, 5_000_000) do
    println(s"₹$amount -> ${approve(amount)}")
