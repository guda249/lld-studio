from abc import ABC, abstractmethod


class Enemy(ABC):
    def __init__(self, health: int) -> None:
        self.health = health

    @abstractmethod
    def attack(self) -> str: ...


class Wolf(Enemy):
    def attack(self) -> str:
        return f"Wolf ({self.health} HP) bites"


class Scorpion(Enemy):
    def attack(self) -> str:
        return f"Scorpion ({self.health} HP) stings"


class Level(ABC):
    name = "Level"

    @abstractmethod
    def create_enemy(self, wave: int) -> Enemy:  # factory method, called once per enemy
        ...

    def spawn_wave(self, wave: int) -> list[Enemy]:
        # shared rule for every level: later waves bring more enemies
        count = wave + 1
        return [self.create_enemy(wave) for _ in range(count)]


class ForestLevel(Level):
    name = "Forest"

    def create_enemy(self, wave: int) -> Enemy:
        return Wolf(40 + 10 * wave)


class DesertLevel(Level):
    name = "Desert"

    def create_enemy(self, wave: int) -> Enemy:
        return Scorpion(30 + 15 * wave)


total = 0
for level in (ForestLevel(), DesertLevel()):
    for wave in (1, 2):
        enemies = level.spawn_wave(wave)
        total += len(enemies)
        print(f"{level.name} wave {wave}: {len(enemies)} x {enemies[0].attack()}")
print(f"Total enemies spawned: {total}")
