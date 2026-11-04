# Adapter: added later. Alert already sends through Channel; a vendor's SMS class doesn't fit it.
from abc import ABC, abstractmethod


class Channel(ABC):  # target: the interface our code already uses
    @abstractmethod
    def send(self, to: str, text: str) -> str: ...


class EmailChannel(Channel):
    def send(self, to: str, text: str) -> str:
        return f"Email to {to}: {text}"


class BulkSmsGateway:  # adaptee: the vendor's class; we can't change it
    def push(self, msisdn: str, payload: dict[str, str]) -> int:
        print(f"  [gateway] {msisdn} <- {payload['body']}")
        return 202


class BulkSmsAdapter(Channel):  # adapter: translates send() into push()
    def __init__(self, gateway: BulkSmsGateway) -> None:
        self._gateway = gateway

    def send(self, to: str, text: str) -> str:
        msisdn = to.replace("+", "").replace("-", "")
        status = self._gateway.push(msisdn, {"body": text, "type": "transactional"})
        return f"SMS to {to}: {'sent' if status == 202 else 'failed'}"


class Alert:  # client: only knows Channel
    def __init__(self, channel: Channel) -> None:
        self._channel = channel

    def deliver(self, to: str, text: str) -> str:
        return self._channel.send(to, text)


if __name__ == "__main__":
    print(Alert(EmailChannel()).deliver("ops@shop.example", "Payments are down. We are on it."))
    print(Alert(BulkSmsAdapter(BulkSmsGateway())).deliver("+91-98450-11111", "Payments are down. We are on it."))
