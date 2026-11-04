import scala.collection.mutable
import scala.util.Random

// Flyweight: the heavy, shared part (mesh and texture).
final case class TreeType(species: String, texture: String, meshKb: Int)

class TreeTypeFactory:
  private val types = mutable.Map.empty[String, TreeType]

  def get(species: String, texture: String, meshKb: Int): TreeType =
    types.getOrElseUpdate(species, TreeType(species, texture, meshKb))

  def count: Int = types.size

// Context: where one tree stands. Only a few bytes each.
final case class Tree(x: Int, y: Int, kind: TreeType)

@main def forestDemo(): Unit =
  val rng = new Random(42)
  val factory = TreeTypeFactory()
  val catalogue = Vector(("neem", "neem.png", 900), ("banyan", "banyan.png", 1500), ("palm", "palm.png", 600))
  val forest = mutable.ArrayBuffer.empty[Tree]
  for _ <- 0 until 20000 do
    val (species, texture, kb) = catalogue(rng.nextInt(catalogue.size))
    forest += Tree(rng.nextInt(1000), rng.nextInt(1000), factory.get(species, texture, kb))

  val sharedMb = catalogue.map(_._3).sum / 1000.0
  val naiveMb = forest.map(_.kind.meshKb.toLong).sum / 1000.0
  println(s"${forest.size} trees, ${factory.count} tree types")
  println(f"mesh memory: $sharedMb%.1f MB shared instead of $naiveMb%,.0f MB copied")
  println(s"first tree: ${forest.head.kind.species} at (${forest.head.x}, ${forest.head.y})")
