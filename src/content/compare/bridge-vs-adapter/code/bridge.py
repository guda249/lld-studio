# Bridge: designed up front. Kinds of alert and ways to send them grow separately, joined by one field.
from abc import ABC, abstractmethod


class Channel(ABC):  # implementation side: HOW a message travels
    @abstractmethod
    def send(self, to: str, text: str) -> str: ...


class SmsChannel(Channel):
    def send(self, to: str, text: str) -> str:
        return f"SMS to {to}: {text}"


class EmailChannel(Channel):
    def send(self, to: str, text: str) -> str:
        return f"Email to {to}: {text}"


class Alert(ABC):  # abstraction side: WHAT we tell people; the channel field is the bridge
    def __init__(self, channel: Channel) -> None:
        self._channel = channel

    @abstractmethod
    def deliver(self, to: str) -> str: ...


class OutageAlert(Alert):
    def deliver(self, to: str) -> str:
        return self._channel.send(to, "Payments are down. We are on it.")


class BillReminder(Alert):
    def deliver(self, to: str) -> str:
        return self._channel.send(to, "Your bill is due tomorrow.")


if __name__ == "__main__":
    # 2 alerts + 2 channels = 4 classes, yet all 4 combinations work
    print(OutageAlert(SmsChannel()).deliver("+91-98450-11111"))
    print(OutageAlert(EmailChannel()).deliver("ops@shop.example"))
    print(BillReminder(SmsChannel()).deliver("+91-98450-22222"))
    print(BillReminder(EmailChannel()).deliver("asha@mail.example"))
