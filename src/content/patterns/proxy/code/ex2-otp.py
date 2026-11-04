from abc import ABC, abstractmethod


class SmsGateway(ABC):
    @abstractmethod
    def send_otp(self, phone: str, now: int) -> str: ...


class VendorSmsGateway(SmsGateway):
    """The real vendor charges ₹0.20 per SMS."""

    def __init__(self) -> None:
        self.sent = 0

    def send_otp(self, phone: str, now: int) -> str:
        self.sent += 1
        return f"OTP sent to {phone}"


class RateLimitedSms(SmsGateway):
    """Protection proxy: at most `limit` OTPs per phone in any `window` seconds."""

    def __init__(self, real: SmsGateway, limit: int, window: int) -> None:
        self._real = real
        self._limit = limit
        self._window = window
        self._history: dict[str, list[int]] = {}

    def send_otp(self, phone: str, now: int) -> str:
        recent = [t for t in self._history.get(phone, []) if now - t < self._window]
        if len(recent) >= self._limit:
            self._history[phone] = recent
            return f"blocked {phone}: try after {recent[0] + self._window - now}s"
        self._history[phone] = recent + [now]
        return self._real.send_otp(phone, now)


vendor = VendorSmsGateway()
sms: SmsGateway = RateLimitedSms(vendor, limit=3, window=60)
for second in [0, 5, 10, 15, 70]:          # a fake clock, so the demo never sleeps
    print(f"t={second:>2}s  {sms.send_otp('+91-98450-12345', second)}")
print(f"t=20s  {sms.send_otp('+91-99000-55555', 20)}")
print(f"vendor billed for {vendor.sent} SMS = ₹{vendor.sent * 0.20:.2f}")
