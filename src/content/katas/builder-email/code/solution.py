from dataclasses import dataclass


@dataclass(frozen=True)
class Email:
    sender: str
    to: tuple[str, ...]
    cc: tuple[str, ...]
    bcc: tuple[str, ...]
    subject: str
    body: str
    urgent: bool

    def summary(self) -> str:
        flag = "[URGENT] " if self.urgent else ""
        return f"{flag}{self.subject} -> to={list(self.to)} cc={list(self.cc)} bcc={len(self.bcc)} hidden"


class EmailBuilder:
    def __init__(self, sender: str) -> None:
        self._sender = sender
        self._to: list[str] = []
        self._cc: list[str] = []
        self._bcc: list[str] = []
        self._subject = ""
        self._body = ""
        self._urgent = False

    def to(self, address: str) -> "EmailBuilder":
        self._to.append(address)
        return self

    def cc(self, address: str) -> "EmailBuilder":
        self._cc.append(address)
        return self

    def bcc(self, address: str) -> "EmailBuilder":
        self._bcc.append(address)
        return self

    def subject(self, text: str) -> "EmailBuilder":
        self._subject = text
        return self

    def body(self, text: str) -> "EmailBuilder":
        self._body = text
        return self

    def urgent(self) -> "EmailBuilder":
        self._urgent = True
        return self

    def build(self) -> Email:
        if not self._to:
            raise ValueError("an email needs at least one recipient")
        return Email(self._sender, tuple(self._to), tuple(self._cc), tuple(self._bcc),
                     self._subject, self._body, self._urgent)


if __name__ == "__main__":
    welcome = EmailBuilder("hr@acme.test").to("sam@acme.test").subject("Welcome!").body("Glad you joined.").build()
    outage = (
        EmailBuilder("ops@acme.test")
        .to("oncall@acme.test").cc("lead@acme.test").bcc("audit@acme.test")
        .subject("Database down").body("Failover started.").urgent()
        .build()
    )
    print(welcome.summary())
    print(outage.summary())
    try:
        EmailBuilder("ops@acme.test").subject("Nobody").body("No recipients.").build()
    except ValueError as error:
        print(f"Rejected: {error}")
