from __future__ import annotations


class DocState:                                        # state
    name = "?"

    def submit(self, doc: Document, user: str) -> DocState:
        raise PermissionError(f"{user} cannot submit a {self.name} document")

    def approve(self, doc: Document, user: str) -> DocState:
        raise PermissionError(f"{user} cannot approve a {self.name} document")

    def reject(self, doc: Document, user: str, reason: str) -> DocState:
        raise PermissionError(f"{user} cannot reject a {self.name} document")


class Draft(DocState):
    name = "draft"

    def submit(self, doc: Document, user: str) -> DocState:
        if user != doc.author:
            return super().submit(doc, user)           # only the author may submit
        return InReview()


class InReview(DocState):
    name = "in review"

    def approve(self, doc: Document, user: str) -> DocState:
        if user == doc.author:
            raise PermissionError("authors cannot approve their own work")
        return Published()

    def reject(self, doc: Document, user: str, reason: str) -> DocState:
        doc.notes.append(f"{user}: {reason}")
        return Draft()


class Published(DocState):
    name = "published"


class Document:                                        # context
    def __init__(self, title: str, author: str) -> None:
        self.title, self.author = title, author
        self.notes: list[str] = []
        self.state: DocState = Draft()

    def act(self, action: str, user: str, reason: str = "") -> None:
        try:
            match action:
                case "submit":
                    self.state = self.state.submit(self, user)
                case "approve":
                    self.state = self.state.approve(self, user)
                case _:
                    self.state = self.state.reject(self, user, reason)
            print(f"{user:6} {action:8} -> {self.state.name}")
        except PermissionError as err:
            print(f"{user:6} {action:8} -> refused: {err}")


doc = Document("Monsoon travel guide", author="Asha")
doc.act("submit", "Asha")
doc.act("approve", "Asha")
doc.act("reject", "Vikram", reason="add train timings")
doc.act("submit", "Vikram")
doc.act("submit", "Asha")
doc.act("approve", "Vikram")
doc.act("reject", "Vikram", reason="typo")
print("Review notes:", doc.notes)
