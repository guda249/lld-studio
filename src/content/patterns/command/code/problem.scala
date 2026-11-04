class Document:
  var text: String = ""
  def insert(s: String): Unit = text = text + s
  def deleteLast(n: Int): Unit = text = text.dropRight(n)

@main def editorProblem(): Unit =
  val doc = Document()
  // A toolbar button, a keyboard shortcut and a menu item each call the document directly.
  doc.insert("Hello")     // toolbar button
  doc.insert(" world")    // keyboard shortcut
  doc.deleteLast(6)       // menu item
  println(s"'${doc.text}'")
  // Undo? Nothing recorded what was done or how to reverse it.
  println("undo is impossible: there is no history of actions")
