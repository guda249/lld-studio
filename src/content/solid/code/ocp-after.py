# After: a new channel is a new class. NotificationService never changes.
from abc import ABC, abstractmethod


class Notifier(ABC):
    @abstractmethod
    def send(self, user: str, text: str) -> str: ...


class EmailNotifier(Notifier):
    def send(self, user: str, text: str) -> str:
        return f"email to {user}@shop.example: {text}"


class SmsNotifier(Notifier):
    def send(self, user: str, text: str) -> str:
        return f"sms to {user}: {text[:160]}"


class WhatsAppNotifier(Notifier):  # the new request: one new class, nothing else edited
    def send(self, user: str, text: str) -> str:
        return f"whatsapp to {user}: {text}"


class NotificationService:  # closed: works with any Notifier, today's or tomorrow's
    def __init__(self, notifiers: list[Notifier]) -> None:
        self._notifiers = notifiers

    def broadcast(self, user: str, text: str) -> list[str]:
        return [n.send(user, text) for n in self._notifiers]


if __name__ == "__main__":
    service = NotificationService([EmailNotifier(), SmsNotifier(), WhatsAppNotifier()])
    for line in service.broadcast("asha", "Your order has shipped"):
        print(line)
