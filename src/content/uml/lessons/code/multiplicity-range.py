class Player:
    def __init__(self, name: str):
        self.name = name


class Game:
    def __init__(self, players: list[Player]):
        if not 2 <= len(players) <= 4:     # 2..4: the type can't say it, so check it
            raise ValueError(f"need 2 to 4 players, got {len(players)}")
        self.players = players


print(len(Game([Player("Asha"), Player("Ravi")]).players))   # 2
try:
    Game([Player("Asha")])
except ValueError as e:
    print("error:", e)                     # error: need 2 to 4 players, got 1
