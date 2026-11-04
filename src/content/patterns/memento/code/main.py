from dataclasses import dataclass


@dataclass(frozen=True)
class EditorSnapshot:                 # memento: immutable copy of the state
    text: str
    cursor: int


class Editor:                         # originator
    def __init__(self) -> None:
        self._text = ""
        self._cursor = 0

    def write(self, s: str) -> None:
        self._text = self._text[: self._cursor] + s + self._text[self._cursor :]
        self._cursor += len(s)

    def move_cursor(self, position: int) -> None:
        self._cursor = max(0, min(position, len(self._text)))

    @property
    def content(self) -> str:
        return self._text

    def save(self) -> EditorSnapshot:
        return EditorSnapshot(self._text, self._cursor)

    def restore(self, snapshot: EditorSnapshot) -> None:
        self._text, self._cursor = snapshot.text, snapshot.cursor


class History:                        # caretaker: stores, never looks inside
    def __init__(self) -> None:
        self._stack: list[EditorSnapshot] = []

    def push(self, snapshot: EditorSnapshot) -> None:
        self._stack.append(snapshot)

    def pop(self) -> EditorSnapshot | None:
        return self._stack.pop() if self._stack else None


editor, history = Editor(), History()
editor.write("Dear team,")
history.push(editor.save())
editor.write(" the release is cancelled.")
history.push(editor.save())
editor.move_cursor(10)
editor.write(" good news:")
print(editor.content)

while (snapshot := history.pop()) is not None:
    editor.restore(snapshot)
    print("undo ->", editor.content)
