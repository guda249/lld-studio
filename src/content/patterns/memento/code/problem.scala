class Editor:
  var text = ""      // must be public so History can copy it
  var cursor = 0

  def write(s: String): Unit =
    text = text + s
    cursor = text.length

class History:
  private var saved = List.empty[(String, Int)]

  def backup(editor: Editor): Unit =
    saved = (editor.text, editor.cursor) :: saved     // reads the editor's fields

  def undo(editor: Editor): Unit = saved match
    case (t, c) :: rest =>
      editor.text = t                                 // writes the editor's fields
      editor.cursor = c
      saved = rest
    case Nil => println("Nothing to undo")

@main def mementoProblem(): Unit =
  val editor = Editor()
  val history = History()
  editor.write("Hello")
  history.backup(editor)
  editor.write(", world")
  history.undo(editor)
  println(editor.text)
  println("Add a 'selection' field to Editor and History silently forgets it.")
