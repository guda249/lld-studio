class Document:
    def __init__(self) -> None:
        self.text = ""

    def insert(self, s: str) -> None:
        self.text += s

    def delete_last(self, n: int) -> None:
        self.text = self.text[: max(len(self.text) - n, 0)]


doc = Document()
# A toolbar button, a keyboard shortcut and a menu item each call the document directly.
doc.insert("Hello")      # toolbar button
doc.insert(" world")     # keyboard shortcut
doc.delete_last(6)       # menu item
print(repr(doc.text))
# Undo? Nothing recorded what was done or how to reverse it.
print("undo is impossible: there is no history of actions")
