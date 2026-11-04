from abc import ABC, abstractmethod


class Node(ABC):  # component: the common interface
    def __init__(self, name: str) -> None:
        self.name = name

    @abstractmethod
    def size(self) -> int: ...

    @abstractmethod
    def render(self, depth: int = 0) -> str: ...


class File(Node):  # leaf: does the real work
    def __init__(self, name: str, size_bytes: int) -> None:
        super().__init__(name)
        self._size = size_bytes

    def size(self) -> int:
        return self._size

    def render(self, depth: int = 0) -> str:
        return "  " * depth + f"{self.name} ({self._size} B)"


class Folder(Node):  # composite: stores children and delegates to them
    def __init__(self, name: str) -> None:
        super().__init__(name)
        self._children: list[Node] = []

    def add(self, *nodes: Node) -> "Folder":
        self._children.extend(nodes)
        return self

    def size(self) -> int:
        return sum(child.size() for child in self._children)

    def render(self, depth: int = 0) -> str:
        lines = ["  " * depth + f"{self.name}/ ({self.size()} B)"]
        lines += [child.render(depth + 1) for child in self._children]
        return "\n".join(lines)


project = Folder("project").add(
    File("README.md", 1_200),
    Folder("src").add(File("app.py", 5_400), File("utils.py", 800)),
)
print(project.render())
print(f"Total: {project.size()} B; one file: {File('notes.txt', 300).size()} B")
