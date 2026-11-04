enum Status:
  case Placed, Shipped, Delivered, Cancelled

enum Event:
  case Ship, Deliver, Cancel

// the whole state machine is one pure function
def next(s: Status, e: Event): Either[String, Status] = (s, e) match
  case (Status.Placed, Event.Ship)     => Right(Status.Shipped)
  case (Status.Placed, Event.Cancel)   => Right(Status.Cancelled)
  case (Status.Shipped, Event.Deliver) => Right(Status.Delivered)
  case _                               => Left(s"Cannot $e when $s")

@main def stateIdiomatic(): Unit =
  var status: Status = Status.Placed
  for event <- List(Event.Ship, Event.Cancel, Event.Deliver) do
    next(status, event) match
      case Right(s) =>
        status = s
        println(s"$event -> $s")
      case Left(err) => println(s"$event -> refused: $err")
