import random
from dataclasses import dataclass


@dataclass(frozen=True)
class TreeType:
    """Flyweight: the heavy, shared part (mesh and texture)."""
    species: str
    texture: str
    mesh_kb: int


class TreeTypeFactory:
    def __init__(self) -> None:
        self._types: dict[str, TreeType] = {}

    def get(self, species: str, texture: str, mesh_kb: int) -> TreeType:
        if species not in self._types:
            self._types[species] = TreeType(species, texture, mesh_kb)
        return self._types[species]

    def count(self) -> int:
        return len(self._types)


@dataclass(slots=True)
class Tree:
    """Context: where one tree stands. Only a few bytes each."""
    x: int
    y: int
    kind: TreeType


rng = random.Random(42)
factory = TreeTypeFactory()
catalogue = [("neem", "neem.png", 900), ("banyan", "banyan.png", 1500), ("palm", "palm.png", 600)]
forest: list[Tree] = []
for _ in range(20_000):
    species, texture, kb = rng.choice(catalogue)
    forest.append(Tree(rng.randrange(1000), rng.randrange(1000), factory.get(species, texture, kb)))

shared_mb = sum(kb for _, _, kb in catalogue) / 1000
naive_mb = sum(t.kind.mesh_kb for t in forest) / 1000
print(f"{len(forest)} trees, {factory.count()} tree types")
print(f"mesh memory: {shared_mb:.1f} MB shared instead of {naive_mb:,.0f} MB copied")
print(f"first tree: {forest[0].kind.species} at ({forest[0].x}, {forest[0].y})")
