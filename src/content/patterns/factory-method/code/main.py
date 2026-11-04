from abc import ABC, abstractmethod


class Message(ABC):
    @abstractmethod
    def deliver(self, text: str) -> str: ...


class EmailMessage(Message):
    def deliver(self, text: str) -> str:
        return f"Email: {text}"


class SmsMessage(Message):
    def deliver(self, text: str) -> str:
        return f"SMS: {text[:160]}"


class Notifier(ABC):
    @abstractmethod
    def create_message(self) -> Message:  # the factory method
        ...

    def send(self, text: str) -> str:  # business logic, never changes
        message = self.create_message()
        return message.deliver(text)


class EmailNotifier(Notifier):
    def create_message(self) -> Message:
        return EmailMessage()


class SmsNotifier(Notifier):
    def create_message(self) -> Message:
        return SmsMessage()


for notifier in (EmailNotifier(), SmsNotifier()):
    print(notifier.send("Your order has shipped"))
