# Strategy: the user picks a heading style in Settings; the editor uses it for every heading.
from abc import ABC, abstractmethod


class CaseStyle(ABC):  # strategy: one way to change the text
    @abstractmethod
    def apply(self, text: str) -> str: ...


class UpperCase(CaseStyle):
    def apply(self, text: str) -> str:
        return text.upper()


class TitleCase(CaseStyle):
    def apply(self, text: str) -> str:
        return text.title()


class Editor:  # context: holds the current style and uses it again and again
    def __init__(self, style: CaseStyle) -> None:
        self._style = style

    def set_style(self, style: CaseStyle) -> None:
        self._style = style

    def format_heading(self, text: str) -> str:
        return self._style.apply(text)


if __name__ == "__main__":
    editor = Editor(TitleCase())
    print(editor.format_heading("weekly sales report"))
    print(editor.format_heading("next steps"))
    editor.set_style(UpperCase())  # the user changes the setting
    print(editor.format_heading("weekly sales report"))
    print(editor.format_heading("next steps"))
