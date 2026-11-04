class Editor:
    def __init__(self) -> None:
        self._text = ""
        self._cursor = 0

    def write(self, s: str) -> None:
        self._text += s
        self._cursor = len(self._text)


class History:
    """Undo that reaches straight into the editor's private fields."""

    def __init__(self) -> None:
        self._saved: list[tuple[str, int]] = []

    def backup(self, editor: Editor) -> None:
        self._saved.append((editor._text, editor._cursor))    # reads privates

    def undo(self, editor: Editor) -> None:
        editor._text, editor._cursor = self._saved.pop()       # writes privates


editor, history = Editor(), History()
editor.write("Hello")
history.backup(editor)
editor.write(", world")
history.undo(editor)
print(editor._text)
print("Add a 'selection' field to Editor and History silently forgets it.")
