class File(val name: String, val size: Int)
class Folder(val name: String, val children: List[Any])
class Shortcut(val name: String, val target: Any) // a new item type added later

def totalSize(item: Any): Int = item match
  case f: File => f.size
  case d: Folder => d.children.map(totalSize).sum
  case other => throw IllegalArgumentException(s"unknown item ${other.getClass.getSimpleName}")

def countFiles(item: Any): Int = item match // the same type checks, copied again
  case _: File => 1
  case d: Folder => d.children.map(countFiles).sum
  case other => throw IllegalArgumentException(s"unknown item ${other.getClass.getSimpleName}")

@main def compositeProblem(): Unit =
  val project = Folder("project", List(File("README.md", 1200), Folder("src", List(File("app.py", 5400)))))
  println(s"Size ${totalSize(project)} B, ${countFiles(project)} files")
  try println(totalSize(Folder("desktop", List(Shortcut("app", project)))))
  catch case error: IllegalArgumentException =>
    println(s"Error: ${error.getMessage}. Every function must now learn about Shortcut")
