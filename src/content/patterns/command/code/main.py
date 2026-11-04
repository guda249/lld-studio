from abc import ABC, abstractmethod


class Document:  # receiver: the object that really changes
    def __init__(self) -> None:
        self.text = ""


class Command(ABC):
    @abstractmethod
    def execute(self) -> None: ...

    @abstractmethod
    def undo(self) -> None: ...


class InsertText(Command):
    def __init__(self, doc: Document, text: str) -> None:
        self._doc, self._text = doc, text

    def execute(self) -> None:
        self._doc.text += self._text

    def undo(self) -> None:
        cut = len(self._doc.text) - len(self._text)
        self._doc.text = self._doc.text[:cut]


class DeleteLastChars(Command):
    def __init__(self, doc: Document, count: int) -> None:
        self._doc, self._count = doc, count
        self._deleted = ""  # remembered so undo can put it back

    def execute(self) -> None:
        cut = max(len(self._doc.text) - self._count, 0)
        self._deleted = self._doc.text[cut:]
        self._doc.text = self._doc.text[:cut]

    def undo(self) -> None:
        self._doc.text += self._deleted


class Editor:  # invoker: runs commands and keeps the history
    def __init__(self) -> None:
        self._history: list[Command] = []

    def run(self, command: Command) -> None:
        command.execute()
        self._history.append(command)

    def undo(self) -> None:
        if self._history:
            self._history.pop().undo()


doc, editor = Document(), Editor()
editor.run(InsertText(doc, "Hello"))
editor.run(InsertText(doc, " world"))
editor.run(DeleteLastChars(doc, 6))
print(repr(doc.text))  # 'Hello'
editor.undo()
print(repr(doc.text))  # 'Hello world'
editor.undo()
print(repr(doc.text))  # 'Hello'
