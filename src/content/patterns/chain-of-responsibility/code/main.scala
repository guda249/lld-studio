// Handler: knows its own limit and the next approver in the chain.
abstract class Approver(next: Option[Approver]):
  def name: String
  def limit: Int

  def approve(amount: Int): String =
    if amount <= limit then s"$name approved ₹$amount"
    else
      next match
        case Some(n) => n.approve(amount)
        case None    => s"Rejected: ₹$amount needs board approval"

class TeamLead(next: Option[Approver] = None) extends Approver(next):
  val name = "TeamLead"
  val limit = 10_000

class Manager(next: Option[Approver] = None) extends Approver(next):
  val name = "Manager"
  val limit = 100_000

class Director(next: Option[Approver] = None) extends Approver(next):
  val name = "Director"
  val limit = 1_000_000

@main def chainDemo(): Unit =
  // The client builds the chain from the outside and talks only to its first link.
  val chain = TeamLead(Some(Manager(Some(Director()))))
  for amount <- List(4_000, 75_000, 600_000, 5_000_000) do
    println(chain.approve(amount))
