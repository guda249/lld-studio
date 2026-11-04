from enum import Enum


class Status(Enum):
    PLACED = "Placed"
    PAID = "Paid"
    SHIPPED = "Shipped"
    CANCELLED = "Cancelled"


def next_status(s: Status, event: str) -> Status:
    match (s, event):  # one case per arrow
        case (Status.PLACED, "pay"):
            return Status.PAID
        case (Status.PAID, "ship"):
            return Status.SHIPPED
        case (Status.PLACED, "cancel"):
            return Status.CANCELLED
        case (Status.PAID, "cancel"):
            print("  action: refund")
            return Status.CANCELLED
        case _:  # no arrow for this event
            raise ValueError(f"can't {event} when {s.value}")


s = Status.PLACED
for e in ["pay", "cancel", "ship"]:
    try:
        s = next_status(s, e)
        print(e, "->", s.value)
    except ValueError as err:
        print(err)
