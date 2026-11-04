from abc import ABC, abstractmethod


class Document:  # receiver: the thing being changed
    def __init__(self, text: str) -> None:
        self.text = text


class EditCommand(ABC):  # command: each click becomes one of these; it can undo itself
    @abstractmethod
    def execute(self) -> None: ...
    @abstractmethod
    def undo(self) -> None: ...


class UpperCaseCommand(EditCommand):
    def __init__(self, doc: Document) -> None:
        self._doc = doc
        self._before = ""  # the old text is saved in execute()

    def execute(self) -> None:
        self._before = self._doc.text
        self._doc.text = self._doc.text.upper()

    def undo(self) -> None:
        self._doc.text = self._before


class TitleCaseCommand(EditCommand):
    def __init__(self, doc: Document) -> None:
        self._doc = doc
        self._before = ""  # the old text is saved in execute()

    def execute(self) -> None:
        self._before = self._doc.text
        self._doc.text = self._doc.text.title()

    def undo(self) -> None:
        self._doc.text = self._before


class EditHistory:  # invoker: runs commands and keeps them for undo
    def __init__(self) -> None:
        self._done: list[EditCommand] = []

    def run(self, command: EditCommand) -> None:
        command.execute()
        self._done.append(command)

    def undo_last(self) -> None:
        if self._done:
            self._done.pop().undo()


doc = Document("weekly sales report")
history = EditHistory()
for command in (TitleCaseCommand(doc), UpperCaseCommand(doc)):
    history.run(command)
    print(doc.text)
for _ in range(2):
    history.undo_last()
    print(doc.text)
