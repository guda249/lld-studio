enum Status:
  case Placed, Paid, Shipped, Cancelled

def nextStatus(s: Status, event: String): Status =
  (s, event) match  // one case per arrow
    case (Status.Placed, "pay") => Status.Paid
    case (Status.Paid, "ship") => Status.Shipped
    case (Status.Placed, "cancel") => Status.Cancelled
    case (Status.Paid, "cancel") =>
      println("  action: refund")
      Status.Cancelled
    case _ =>  // no arrow for this event
      throw IllegalArgumentException(s"can't $event when $s")

@main def demo(): Unit =
  var s = Status.Placed
  for e <- List("pay", "cancel", "ship") do
    try
      s = nextStatus(s, e)
      println(s"$e -> $s")
    catch case err: IllegalArgumentException => println(err.getMessage)
