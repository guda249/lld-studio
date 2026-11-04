enum Status:
  case Placed, Shipped, Delivered, Cancelled

// one case per arrow in the diagram
def next(s: Status, event: String): Status = (s, event) match
  case (Status.Placed, "ship")     => Status.Shipped
  case (Status.Placed, "cancel")   => Status.Cancelled
  case (Status.Shipped, "deliver") => Status.Delivered
  case _                           => s   // no arrow: nothing happens

@main def demo(): Unit =
  var status = Status.Placed
  for event <- List("ship", "cancel", "deliver") do
    status = next(status, event)
    println(s"$event -> $status")
