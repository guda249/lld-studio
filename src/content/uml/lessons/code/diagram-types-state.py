from enum import Enum


class Status(Enum):
    PLACED = "Placed"
    SHIPPED = "Shipped"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"


# (state, event) -> next state: one entry per arrow in the diagram
MOVES = {
    (Status.PLACED, "ship"): Status.SHIPPED,
    (Status.PLACED, "cancel"): Status.CANCELLED,
    (Status.SHIPPED, "deliver"): Status.DELIVERED,
}

status = Status.PLACED
for event in ["ship", "cancel", "deliver"]:
    status = MOVES.get((status, event), status)   # no arrow: nothing happens
    print(event, "->", status.value)
