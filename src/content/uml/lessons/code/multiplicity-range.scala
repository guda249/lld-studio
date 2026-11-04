class Player(val name: String)

class Game(val players: List[Player]):
  require(players.size >= 2 && players.size <= 4,   // 2..4: the type can't say it, so check it
    s"need 2 to 4 players, got ${players.size}")

@main def demo(): Unit =
  println(Game(List(Player("Asha"), Player("Ravi"))).players.size)   // 2
  try Game(List(Player("Asha")))
  catch case e: IllegalArgumentException => println(s"error: ${e.getMessage}")
