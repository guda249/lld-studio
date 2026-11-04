from abc import ABC, abstractmethod
from typing import Callable


class Message(ABC):
    @abstractmethod
    def deliver(self, text: str) -> str: ...


class EmailMessage(Message):
    def deliver(self, text: str) -> str:
        return f"Email: {text}"


class SmsMessage(Message):
    def deliver(self, text: str) -> str:
        return f"SMS: {text[:160]}"


class Notifier:
    # the "factory method" is just a function handed in
    def __init__(self, make_message: Callable[[], Message]) -> None:
        self._make_message = make_message

    def send(self, text: str) -> str:
        return self._make_message().deliver(text)


# a class is already a callable factory, so no subclasses are needed
for notifier in (Notifier(EmailMessage), Notifier(SmsMessage)):
    print(notifier.send("Your order has shipped"))
