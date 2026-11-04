from dataclasses import dataclass


@dataclass(frozen=True)
class File:
    name: str
    size: int


@dataclass(frozen=True)
class Folder:
    name: str
    children: tuple["File | Folder", ...] = ()


Node = File | Folder  # a closed set of node types


def total_size(node: Node) -> int:  # a new operation is just a recursive function
    match node:
        case File(size=size):
            return size
        case Folder(children=children):
            return sum(total_size(c) for c in children)


def largest_file(node: Node) -> File:
    match node:
        case File():
            return node
        case Folder(children=children):
            return max((largest_file(c) for c in children), key=lambda f: f.size)


project = Folder("project", (File("README.md", 1200), Folder("src", (File("app.py", 5400), File("utils.py", 800)))))
print(f"Total: {total_size(project)} B")
print(f"Largest file: {largest_file(project).name}")
