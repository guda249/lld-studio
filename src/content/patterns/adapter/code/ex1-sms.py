from abc import ABC, abstractmethod


class SmsSender(ABC):  # target: what our OTP code expects
    @abstractmethod
    def send(self, phone: str, text: str) -> bool: ...


class QuickSmsClient:  # vendor SDK 1 (cannot change)
    def __init__(self, healthy: bool) -> None:
        self.healthy = healthy

    def send_message(self, to: str, body: str) -> dict[str, str]:
        return {"state": "queued" if self.healthy else "error"}


class BharatTelClient:  # vendor SDK 2: numbers without +91, returns a status code
    def dispatch(self, numbers: list[str], message: str, priority: int) -> int:
        return 200 if all(len(n) == 10 for n in numbers) else 400


class QuickSmsAdapter(SmsSender):
    def __init__(self, client: QuickSmsClient) -> None:
        self._client = client

    def send(self, phone: str, text: str) -> bool:
        return self._client.send_message(to=phone, body=text)["state"] == "queued"


class BharatTelAdapter(SmsSender):
    def __init__(self, client: BharatTelClient) -> None:
        self._client = client

    def send(self, phone: str, text: str) -> bool:
        local = phone.removeprefix("+91")  # translate our format into theirs
        return self._client.dispatch([local], text, priority=1) == 200


class FallbackSender(SmsSender):  # also an SmsSender: tries each adapter in turn
    def __init__(self, senders: list[tuple[str, SmsSender]]) -> None:
        self._senders = senders

    def send(self, phone: str, text: str) -> bool:
        for name, sender in self._senders:
            ok = sender.send(phone, text)
            print(f"  sent via {name}" if ok else f"  {name} failed, trying next")
            if ok:
                return True
        return False


def send_otp(sender: SmsSender, phone: str, code: str) -> None:
    ok = sender.send(phone, f"Your OTP is {code}")
    print(f"OTP to {phone}: {'delivered' if ok else 'not delivered'}")


send_otp(QuickSmsAdapter(QuickSmsClient(healthy=True)), "+919812345678", "482913")
send_otp(
    FallbackSender([
        ("QuickSms", QuickSmsAdapter(QuickSmsClient(healthy=False))),
        ("BharatTel", BharatTelAdapter(BharatTelClient())),
    ]),
    "+919812345678",
    "771204",
)
