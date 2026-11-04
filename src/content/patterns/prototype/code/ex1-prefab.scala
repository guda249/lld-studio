import scala.collection.mutable

class Enemy(
    val kind: String,
    val health: Int,
    val speed: Double,
    val loot: mutable.ListBuffer[String],
    var x: Int = 0,
    var y: Int = 0
):
  def duplicate(): Enemy = Enemy(kind, health, speed, mutable.ListBuffer.from(loot), x, y)

class PrefabRegistry:
  // level designers tune these once; the game spawns copies of them
  private val prefabs = mutable.Map.empty[String, Enemy]

  def register(name: String, prefab: Enemy): Unit = prefabs(name) = prefab

  def spawn(name: String, x: Int, y: Int): Enemy =
    val enemy = prefabs(name).duplicate()
    enemy.x = x
    enemy.y = y
    enemy

@main def prefabDemo(): Unit =
  val prefabs = PrefabRegistry()
  prefabs.register("goblin", Enemy("goblin", 30, 1.5, mutable.ListBuffer("copper coin")))
  prefabs.register("troll", Enemy("troll", 120, 0.6, mutable.ListBuffer("club", "silver coin")))

  val wave = List(2, 5, 8).map(x => prefabs.spawn("goblin", x, 0)) :+ prefabs.spawn("troll", 5, 9)
  wave.head.loot += "rare gem" // a lucky drop for one goblin only

  for e <- wave do
    println(s"${e.kind} at (${e.x},${e.y}) hp=${e.health} loot=${e.loot.mkString(", ")}")
  println(s"Goblin prefab loot is still: ${prefabs.spawn("goblin", 0, 0).loot.mkString(", ")}")
