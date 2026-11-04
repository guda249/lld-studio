from dataclasses import dataclass, replace


@dataclass(frozen=True)
class EditorState:                    # immutable: each state is its own memento
    text: str = ""
    cursor: int = 0

    def write(self, s: str) -> "EditorState":
        return replace(self, text=self.text + s, cursor=len(self.text) + len(s))


history: list[EditorState] = [EditorState()]
for word in ["Dear team,", " the release", " is cancelled."]:
    history.append(history[-1].write(word))
print(history[-1].text)

history.pop()                         # undo = drop the newest state
print(history[-1].text)
print(f"{len(history)} states kept")
