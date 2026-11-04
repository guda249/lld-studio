case class Node(name: String, children: List[Node] = Nil) // a file, or a folder when it has children

class DepthFirst(root: Node) extends Iterator[String]: // iterator: walks the tree with its own stack
  private var stack: List[(String, Node)] = List((root.name, root))
  var visited = 0

  def hasNext: Boolean = stack.nonEmpty

  def next(): String =
    if stack.isEmpty then throw java.util.NoSuchElementException("walk finished")
    val (path, node) = stack.head
    // children go on top of the stack in order, so the first child comes out first
    stack = node.children.map(child => (s"$path/${child.name}", child)) ++ stack.tail
    visited += 1
    path

@main def fileTreeDemo(): Unit =
  val project = Node("app", List(
    Node("src", List(Node("main.py"), Node("utils", List(Node("dates.py"), Node("money.py"))))),
    Node("tests", List(Node("test_money.py"))),
    Node("README.md")
  ))

  for path <- DepthFirst(project) do println(path)

  val total = DepthFirst(project).size
  val walker = DepthFirst(project)
  val found = walker.find(_.endsWith("money.py")).getOrElse("none")
  println(s"found $found (visited ${walker.visited} of $total nodes)")
