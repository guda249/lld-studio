from abc import ABC, abstractmethod


class ChatMediator(ABC):  # mediator interface
    @abstractmethod
    def send(self, sender: str, text: str, to: str | None) -> None: ...


class Member:  # colleague: knows only the mediator, never other members
    def __init__(self, name: str) -> None:
        self.name = name
        self.room: ChatMediator | None = None
        self.inbox: list[str] = []

    def say(self, text: str, to: str | None = None) -> None:
        if self.room is None:
            raise RuntimeError(f"{self.name} has not joined a room")
        self.room.send(self.name, text, to)

    def receive(self, sender: str, text: str) -> None:
        self.inbox.append(f"{sender}: {text}")


class ChatRoom(ChatMediator):  # concrete mediator: every routing rule lives here
    def __init__(self) -> None:
        self._members: dict[str, Member] = {}
        self._muted: set[tuple[str, str]] = set()  # (listener, sender)

    def join(self, member: Member) -> None:
        self._members[member.name] = member
        member.room = self

    def mute(self, listener: str, sender: str) -> None:
        self._muted.add((listener, sender))

    def send(self, sender: str, text: str, to: str | None) -> None:
        if to is not None:
            targets = [self._members[to]] if to in self._members else []
        else:
            targets = [m for name, m in self._members.items() if name != sender]
        for member in targets:
            if (member.name, sender) not in self._muted:
                member.receive(sender, text)


room = ChatRoom()
asha, ravi, meera = Member("asha"), Member("ravi"), Member("meera")
for m in (asha, ravi, meera):
    room.join(m)
room.mute("asha", "ravi")  # a new rule: one change, in the mediator only

asha.say("Standup in 5 minutes")  # to everyone else
ravi.say("Can you review my PR?", to="meera")  # direct message
ravi.say("Lunch at 1?")  # asha has muted ravi
for m in (asha, ravi, meera):
    print(f"{m.name:<5} inbox: {' | '.join(m.inbox)}")
