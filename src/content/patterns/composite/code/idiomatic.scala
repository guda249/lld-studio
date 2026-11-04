sealed trait Node // a closed set of node types
final case class File(name: String, size: Int) extends Node
final case class Folder(name: String, children: List[Node]) extends Node

def totalSize(node: Node): Int = node match // a new operation is just a recursive function
  case File(_, size) => size
  case Folder(_, children) => children.map(totalSize).sum

def largestFile(node: Node): File = node match
  case f: File => f
  case Folder(_, children) => children.map(largestFile).maxBy(_.size)

@main def compositeIdiomatic(): Unit =
  val project = Folder("project", List(
    File("README.md", 1200),
    Folder("src", List(File("app.py", 5400), File("utils.py", 800)))
  ))
  println(s"Total: ${totalSize(project)} B")
  println(s"Largest file: ${largestFile(project).name}")
