class Email:
    # seven positional arguments: easy to swap cc and bcc, or subject and body
    def __init__(self, sender: str, to: list[str], cc: list[str], bcc: list[str],
                 subject: str, body: str, urgent: bool) -> None:
        if not to:
            raise ValueError("an email needs at least one recipient")
        self.sender = sender
        self.to = to
        self.cc = cc
        self.bcc = bcc
        self.subject = subject
        self.body = body
        self.urgent = urgent

    def summary(self) -> str:
        flag = "[URGENT] " if self.urgent else ""
        return f"{flag}{self.subject} -> to={self.to} cc={self.cc} bcc={len(self.bcc)} hidden"


if __name__ == "__main__":
    welcome = Email("hr@acme.test", ["sam@acme.test"], [], [], "Welcome!", "Glad you joined.", False)
    outage = Email("ops@acme.test", ["oncall@acme.test"], ["lead@acme.test"], ["audit@acme.test"],
                   "Database down", "Failover started.", True)
    print(welcome.summary())
    print(outage.summary())
    try:
        Email("ops@acme.test", [], [], [], "Nobody", "No recipients.", False)
    except ValueError as error:
        print(f"Rejected: {error}")
