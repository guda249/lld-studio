class File:
    def __init__(self, name: str, size: int) -> None:
        self.name = name
        self.size = size


class Folder:
    def __init__(self, name: str, children: list[object]) -> None:
        self.name = name
        self.children = children


class Shortcut:  # a new item type added later
    def __init__(self, name: str, target: object) -> None:
        self.name = name
        self.target = target


def total_size(item: object) -> int:
    if isinstance(item, File):
        return item.size
    if isinstance(item, Folder):
        return sum(total_size(c) for c in item.children)
    raise TypeError(f"unknown item {type(item).__name__}")


def count_files(item: object) -> int:  # the same type checks, copied again
    if isinstance(item, File):
        return 1
    if isinstance(item, Folder):
        return sum(count_files(c) for c in item.children)
    raise TypeError(f"unknown item {type(item).__name__}")


project = Folder("project", [File("README.md", 1200), Folder("src", [File("app.py", 5400)])])
print(f"Size {total_size(project)} B, {count_files(project)} files")
try:
    total_size(Folder("desktop", [Shortcut("app", project)]))
except TypeError as error:
    print(f"Error: {error}. Every function must now learn about Shortcut")
