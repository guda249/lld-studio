from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class Customer:
    name: str
    phone: str
    email: str


class Channel(ABC):  # implementation side: how a message travels
    @abstractmethod
    def deliver(self, customer: Customer, subject: str, body: str) -> str: ...


class SmsChannel(Channel):
    def deliver(self, customer: Customer, subject: str, body: str) -> str:
        return f"SMS to {customer.phone}: {body}"


class EmailChannel(Channel):
    def deliver(self, customer: Customer, subject: str, body: str) -> str:
        return f"Email to {customer.email} [{subject}] Dear {customer.name}, {body}"


class PushChannel(Channel):
    def deliver(self, customer: Customer, subject: str, body: str) -> str:
        return f"Push to {customer.name}'s phone: {subject}"


class Notification(ABC):  # abstraction side: what the message says
    def __init__(self, channel: Channel) -> None:
        self._channel = channel  # the bridge

    @abstractmethod
    def send(self, customer: Customer) -> str: ...


class TransactionAlert(Notification):
    def __init__(self, channel: Channel, amount: int, merchant: str) -> None:
        super().__init__(channel)
        self._amount = amount
        self._merchant = merchant

    def send(self, customer: Customer) -> str:
        body = f"₹{self._amount:,} spent at {self._merchant}. Not you? Call 1800-123-456"
        return self._channel.deliver(customer, "Debit alert", body)


class StatementReady(Notification):
    def __init__(self, channel: Channel, month: str) -> None:
        super().__init__(channel)
        self._month = month

    def send(self, customer: Customer) -> str:
        return self._channel.deliver(customer, f"{self._month} statement", "your statement is ready to download.")


meera = Customer("Meera", "+919900112233", "meera@example.com")
print(TransactionAlert(SmsChannel(), 4999, "Croma, Pune").send(meera))
print(TransactionAlert(PushChannel(), 4999, "Croma, Pune").send(meera))
print(StatementReady(EmailChannel(), "October").send(meera))
print("2 message types x 3 channels = 6 combinations from 5 classes")
