import scala.collection.mutable

abstract class Node(val name: String): // component: the common interface
  def size: Int
  def render(depth: Int): String

class File(fileName: String, sizeBytes: Int) extends Node(fileName): // leaf: does the real work
  def size: Int = sizeBytes
  def render(depth: Int): String = "  " * depth + s"$name ($sizeBytes B)"

class Folder(folderName: String) extends Node(folderName): // composite: delegates to children
  private val children = mutable.ListBuffer.empty[Node]

  def add(nodes: Node*): Folder =
    children ++= nodes
    this

  def size: Int = children.map(_.size).sum

  def render(depth: Int): String =
    val header = "  " * depth + s"$name/ ($size B)"
    (header :: children.toList.map(_.render(depth + 1))).mkString("\n")

@main def compositeDemo(): Unit =
  val project = Folder("project").add(
    File("README.md", 1200),
    Folder("src").add(File("app.py", 5400), File("utils.py", 800))
  )
  println(project.render(0))
  println(s"Total: ${project.size} B; one file: ${File("notes.txt", 300).size} B")
