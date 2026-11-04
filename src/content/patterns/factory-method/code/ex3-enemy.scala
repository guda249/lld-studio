abstract class Enemy(val health: Int):
  def attack(): String

class Wolf(hp: Int) extends Enemy(hp):
  def attack(): String = s"Wolf ($health HP) bites"

class Scorpion(hp: Int) extends Enemy(hp):
  def attack(): String = s"Scorpion ($health HP) stings"

abstract class Level:
  def name: String
  def createEnemy(wave: Int): Enemy // factory method, called once per enemy

  def spawnWave(wave: Int): List[Enemy] =
    // shared rule for every level: later waves bring more enemies
    val count = wave + 1
    List.fill(count)(createEnemy(wave))

class ForestLevel extends Level:
  val name: String = "Forest"
  def createEnemy(wave: Int): Enemy = Wolf(40 + 10 * wave)

class DesertLevel extends Level:
  val name: String = "Desert"
  def createEnemy(wave: Int): Enemy = Scorpion(30 + 15 * wave)

@main def enemySpawnDemo(): Unit =
  var total = 0
  val levels: List[Level] = List(ForestLevel(), DesertLevel())
  for level <- levels; wave <- List(1, 2) do
    val enemies = level.spawnWave(wave)
    total += enemies.size
    println(s"${level.name} wave $wave: ${enemies.size} x ${enemies.head.attack()}")
  println(s"Total enemies spawned: $total")
