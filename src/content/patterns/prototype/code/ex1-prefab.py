import copy
from dataclasses import dataclass, field


@dataclass
class Enemy:
    kind: str
    health: int
    speed: float
    loot: list[str] = field(default_factory=list)
    x: int = 0
    y: int = 0

    def duplicate(self) -> "Enemy":
        return copy.deepcopy(self)


class PrefabRegistry:
    # level designers tune these once; the game spawns copies of them
    def __init__(self) -> None:
        self._prefabs: dict[str, Enemy] = {}

    def register(self, name: str, prefab: Enemy) -> None:
        self._prefabs[name] = prefab

    def spawn(self, name: str, x: int, y: int) -> Enemy:
        enemy = self._prefabs[name].duplicate()
        enemy.x, enemy.y = x, y
        return enemy


prefabs = PrefabRegistry()
prefabs.register("goblin", Enemy("goblin", 30, 1.5, ["copper coin"]))
prefabs.register("troll", Enemy("troll", 120, 0.6, ["club", "silver coin"]))

wave = [prefabs.spawn("goblin", x, 0) for x in (2, 5, 8)] + [prefabs.spawn("troll", 5, 9)]
wave[0].loot.append("rare gem")  # a lucky drop for one goblin only

for e in wave:
    print(f"{e.kind} at ({e.x},{e.y}) hp={e.health} loot={', '.join(e.loot)}")
print(f"Goblin prefab loot is still: {', '.join(prefabs.spawn('goblin', 0, 0).loot)}")
