final case class EditorSnapshot(text: String, cursor: Int)     // memento (immutable)

class Editor:                                                  // originator
  private var text = ""
  private var cursor = 0

  def write(s: String): Unit =
    text = text.patch(cursor, s, 0)
    cursor += s.length

  def moveCursor(position: Int): Unit = cursor = position.max(0).min(text.length)

  def content: String = text

  def save(): EditorSnapshot = EditorSnapshot(text, cursor)

  def restore(snapshot: EditorSnapshot): Unit =
    text = snapshot.text
    cursor = snapshot.cursor

class History:                                                 // caretaker
  private var stack = List.empty[EditorSnapshot]

  def push(snapshot: EditorSnapshot): Unit = stack = snapshot :: stack

  def pop(): Option[EditorSnapshot] = stack match
    case head :: tail =>
      stack = tail
      Some(head)
    case Nil => None

@main def mementoDemo(): Unit =
  val editor = Editor()
  val history = History()
  editor.write("Dear team,")
  history.push(editor.save())
  editor.write(" the release is cancelled.")
  history.push(editor.save())
  editor.moveCursor(10)
  editor.write(" good news:")
  println(editor.content)

  var next = history.pop()
  while next.isDefined do
    next.foreach(editor.restore)
    println(s"undo -> ${editor.content}")
    next = history.pop()
