from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass(frozen=True)
class User:
    user_id: str
    name: str
    email: str | None = None
    phone: str | None = None
    push_token: str | None = None
    # category -> channel names, in the order the user prefers them
    prefs: dict[str, list[str]] = field(default_factory=dict)


@dataclass(frozen=True)
class Event:
    name: str
    user_id: str
    at: int  # minutes since the start of the day; passed in, so runs are repeatable
    data: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class Delivery:
    event: str
    user: str
    channel: str
    status: str


# ---------- Strategy: every channel delivers the same text its own way ----------
class Channel(ABC):
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    def send(self, user: User, text: str, now: int) -> str: ...


class EmailChannel(Channel):
    def __init__(self) -> None:
        self.outbox: list[str] = []

    def name(self) -> str:
        return "email"

    def send(self, user: User, text: str, now: int) -> str:
        if not user.email:
            return "no email address"
        self.outbox.append(f"{user.email}: {text}")
        return "sent"


class SmsChannel(Channel):
    def __init__(self) -> None:
        self.outbox: list[str] = []

    def name(self) -> str:
        return "sms"

    def send(self, user: User, text: str, now: int) -> str:
        if not user.phone:
            return "no phone number"
        self.outbox.append(f"{user.phone}: {text[:60]}")  # SMS is short: cut long texts
        return "sent"


class PushChannel(Channel):
    def __init__(self) -> None:
        self.outbox: list[str] = []

    def name(self) -> str:
        return "push"

    def send(self, user: User, text: str, now: int) -> str:
        if not user.push_token:
            return "app not installed"
        self.outbox.append(f"{user.push_token}: {text}")
        return "sent"


# ---------- Decorator: adds a per-user limit to ANY channel, without touching it ----------
class RateLimitedChannel(Channel):
    def __init__(self, inner: Channel, limit: int, window: int) -> None:
        self._inner = inner
        self._limit = limit
        self._window = window
        self._recent: dict[str, list[int]] = {}

    def name(self) -> str:
        return self._inner.name()

    def send(self, user: User, text: str, now: int) -> str:
        times = [t for t in self._recent.get(user.user_id, []) if t > now - self._window]
        if len(times) >= self._limit:
            self._recent[user.user_id] = times
            return "rate limited"
        status = self._inner.send(user, text, now)
        if status == "sent":
            times.append(now)
        self._recent[user.user_id] = times
        return status


class TemplateStore:
    def __init__(self, templates: dict[str, tuple[str, str]]) -> None:
        self._templates = templates  # event name -> (category, text with {placeholders})

    def render(self, event: Event, user: User) -> tuple[str, str] | None:
        found = self._templates.get(event.name)
        if found is None:
            return None
        category, text = found
        return category, text.format(name=user.name, **event.data)


# ---------- Observer: services publish events; the notification service is one subscriber ----------
class EventListener(ABC):
    @abstractmethod
    def on_event(self, event: Event) -> None: ...


class EventBus:
    def __init__(self) -> None:
        self._listeners: list[EventListener] = []

    def subscribe(self, listener: EventListener) -> None:
        self._listeners.append(listener)

    def publish(self, event: Event) -> None:
        for listener in self._listeners:
            listener.on_event(event)


class NotificationService(EventListener):
    """Security messages go to every preferred channel; others stop at the first channel that works."""

    def __init__(self, users: dict[str, User], templates: TemplateStore, channels: dict[str, Channel]) -> None:
        self._users = users
        self._templates = templates
        self._channels = channels
        self.log: list[Delivery] = []

    def on_event(self, event: Event) -> None:
        user = self._users.get(event.user_id)
        rendered = self._templates.render(event, user) if user else None
        if user is None or rendered is None:
            self.log.append(Delivery(event.name, event.user_id, "-", "ignored"))
            return
        category, text = rendered
        for channel_name in user.prefs.get(category, ["email"]):
            status = self._channels[channel_name].send(user, text, event.at)
            self.log.append(Delivery(event.name, user.name, channel_name, status))
            if status == "sent" and category != "security":
                return


if __name__ == "__main__":
    asha = User("u1", "Asha", email="asha@mail.test", phone="+91-90000-00001", push_token="dev-a",
                prefs={"orders": ["push", "sms", "email"], "security": ["sms", "email"], "offers": ["email"]})
    ben = User("u2", "Ben", email="ben@mail.test", prefs={"orders": ["sms", "email"]})
    templates = TemplateStore({
        "order.shipped": ("orders", "Hi {name}, order {order} is on its way"),
        "login.new_device": ("security", "{name}, new sign-in from {device}. Not you? Reset now."),
        "offer.sale": ("offers", "{name}, {percent}% off this weekend"),
    })
    email, sms, push = EmailChannel(), SmsChannel(), PushChannel()
    service = NotificationService({"u1": asha, "u2": ben}, templates,
                                  {"email": email, "sms": RateLimitedChannel(sms, limit=2, window=60), "push": push})
    bus = EventBus()
    bus.subscribe(service)

    bus.publish(Event("order.shipped", "u1", 0, {"order": "#501"}))
    bus.publish(Event("order.shipped", "u2", 1, {"order": "#502"}))
    for minute in (2, 3, 4, 70):
        bus.publish(Event("login.new_device", "u1", minute, {"device": "Chrome on Linux"}))
    bus.publish(Event("offer.sale", "u2", 5, {"percent": "20"}))
    bus.publish(Event("cart.abandoned", "u2", 6))

    for d in service.log:
        print(f"{d.event:<17} {d.user:<5} {d.channel:<6} {d.status}")
    for channel in (email, sms, push):
        print(f"{channel.name()} outbox ({len(channel.outbox)}): {channel.outbox[0]}")
