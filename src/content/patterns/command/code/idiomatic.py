from collections import deque
from typing import Callable

# Without undo, a command is just a function with no arguments.
Command = Callable[[], None]


def send_email(to: str) -> Command:
    return lambda: print(f"email sent to {to}")


def charge_card(user: str, amount: int) -> Command:
    return lambda: print(f"charged {user} ₹{amount}")


queue: deque[Command] = deque()
queue.append(send_email("asha@example.com"))
queue.append(charge_card("ravi", 499))
queue.append(lambda: print("cache cleared"))

print(f"{len(queue)} commands queued, running them now:")
while queue:
    command = queue.popleft()
    command()
