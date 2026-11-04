final case class EditorState(text: String = "", cursor: Int = 0):   // immutable: its own memento
  def write(s: String): EditorState =
    copy(text = text + s, cursor = text.length + s.length)

@main def mementoIdiomatic(): Unit =
  val words = List("Dear team,", " the release", " is cancelled.")
  // newest state first: the list itself is the history
  val history = words.foldLeft(List(EditorState()))((states, w) => states.head.write(w) :: states)
  println(history.head.text)

  val afterUndo = history.tail                                     // undo = drop the newest state
  println(afterUndo.head.text)
  println(s"${afterUndo.size} states kept")
