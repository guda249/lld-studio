from enum import Enum


class Status(Enum):
    PLACED = "placed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


TRANSITIONS: dict[tuple[Status, str], Status] = {     # the whole state machine as data
    (Status.PLACED, "ship"): Status.SHIPPED,
    (Status.PLACED, "cancel"): Status.CANCELLED,
    (Status.SHIPPED, "deliver"): Status.DELIVERED,
}


def next_status(current: Status, event: str) -> Status:
    if (current, event) not in TRANSITIONS:
        raise ValueError(f"Cannot {event} when {current.value}")
    return TRANSITIONS[(current, event)]


status = Status.PLACED
for event in ["ship", "cancel", "deliver"]:
    try:
        status = next_status(status, event)
        print(f"{event:8} -> {status.value}")
    except ValueError as err:
        print(f"{event:8} -> refused: {err}")
