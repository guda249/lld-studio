from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class Ticket:
    id: int
    topic: str
    priority: str = "P3"
    path: list[str] = field(default_factory=list)


class SupportHandler(ABC):
    name = "Handler"

    def __init__(self) -> None:
        self._next: "SupportHandler | None" = None

    def set_next(self, handler: "SupportHandler") -> "SupportHandler":
        self._next = handler
        return handler  # returning it lets us chain set_next calls

    def handle(self, ticket: Ticket) -> str:
        ticket.path.append(self.name)
        if self.can_handle(ticket):
            return f"{self.name} resolved it"
        if self._next is None:
            return "nobody could resolve it"
        return self._next.handle(ticket)

    @abstractmethod
    def can_handle(self, ticket: Ticket) -> bool: ...


class Chatbot(SupportHandler):
    name = "Chatbot"

    def can_handle(self, ticket: Ticket) -> bool:
        return ticket.topic in {"password reset", "order status"}


class Level1Agent(SupportHandler):
    name = "Level1Agent"

    def can_handle(self, ticket: Ticket) -> bool:
        return ticket.topic in {"refund", "billing"}


class Level2Specialist(SupportHandler):
    name = "Level2Specialist"

    def can_handle(self, ticket: Ticket) -> bool:
        return ticket.topic == "bug" and ticket.priority != "P1"


class Engineer(SupportHandler):
    name = "Engineer"

    def can_handle(self, ticket: Ticket) -> bool:
        return True  # last link: the safety net that takes everything


chain = Chatbot()
chain.set_next(Level1Agent()).set_next(Level2Specialist()).set_next(Engineer())

tickets = [Ticket(1, "password reset"), Ticket(2, "refund"), Ticket(3, "bug"), Ticket(4, "bug", "P1")]
for t in tickets:
    result = chain.handle(t)
    print(f"#{t.id} {t.topic} ({t.priority}): {result} via {' -> '.join(t.path)}")
