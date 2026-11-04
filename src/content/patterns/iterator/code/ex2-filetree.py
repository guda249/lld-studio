from dataclasses import dataclass, field


@dataclass
class Node:  # a file, or a folder when it has children (a small Composite)
    name: str
    children: list["Node"] = field(default_factory=list)


class DepthFirst:  # iterator: walks the tree with its own stack, one path at a time
    def __init__(self, root: Node) -> None:
        self._stack: list[tuple[str, Node]] = [(root.name, root)]
        self.visited = 0

    def __iter__(self) -> "DepthFirst":
        return self

    def __next__(self) -> str:
        if not self._stack:
            raise StopIteration
        path, node = self._stack.pop()
        self.visited += 1
        for child in reversed(node.children):  # reversed so the first child comes out first
            self._stack.append((f"{path}/{child.name}", child))
        return path


project = Node("app", [
    Node("src", [Node("main.py"), Node("utils", [Node("dates.py"), Node("money.py")])]),
    Node("tests", [Node("test_money.py")]),
    Node("README.md"),
])

for path in DepthFirst(project):
    print(path)

total = sum(1 for _ in DepthFirst(project))
walker = DepthFirst(project)
found = next((p for p in walker if p.endswith("money.py")), "none")
print(f"found {found} (visited {walker.visited} of {total} nodes)")
