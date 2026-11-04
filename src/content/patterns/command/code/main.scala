class Document: // receiver: the object that really changes
  var text: String = ""

trait Command:
  def execute(): Unit
  def undo(): Unit

class InsertText(doc: Document, s: String) extends Command:
  def execute(): Unit = doc.text = doc.text + s
  def undo(): Unit = doc.text = doc.text.dropRight(s.length)

class DeleteLastChars(doc: Document, count: Int) extends Command:
  private var deleted = "" // remembered so undo can put it back

  def execute(): Unit =
    deleted = doc.text.takeRight(count)
    doc.text = doc.text.dropRight(count)

  def undo(): Unit = doc.text = doc.text + deleted

class Editor: // invoker: runs commands and keeps the history
  private var history: List[Command] = Nil

  def run(command: Command): Unit =
    command.execute()
    history = command :: history

  def undo(): Unit = history match
    case last :: rest =>
      last.undo()
      history = rest
    case Nil => ()

@main def commandDemo(): Unit =
  val doc = Document()
  val editor = Editor()
  editor.run(InsertText(doc, "Hello"))
  editor.run(InsertText(doc, " world"))
  editor.run(DeleteLastChars(doc, 6))
  println(s"'${doc.text}'") // 'Hello'
  editor.undo()
  println(s"'${doc.text}'") // 'Hello world'
  editor.undo()
  println(s"'${doc.text}'") // 'Hello'
