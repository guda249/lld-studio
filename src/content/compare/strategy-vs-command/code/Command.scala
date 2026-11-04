// Command: each toolbar click becomes an object that changes the document and can undo itself.

class Document(var text: String) // receiver: the thing being changed

trait EditCommand: // command: one action, remembered so it can be undone
  def execute(): Unit
  def undo(): Unit

class UpperCaseCommand(doc: Document) extends EditCommand:
  private var before = ""
  def execute(): Unit =
    before = doc.text
    doc.text = doc.text.toUpperCase
  def undo(): Unit = doc.text = before

class TitleCaseCommand(doc: Document) extends EditCommand:
  private var before = ""
  def execute(): Unit =
    before = doc.text
    doc.text = doc.text.split(" ").map(_.capitalize).mkString(" ")
  def undo(): Unit = doc.text = before

class EditHistory: // invoker: runs commands and keeps them for undo
  private var done: List[EditCommand] = Nil

  def run(command: EditCommand): Unit =
    command.execute()
    done = command :: done

  def undoLast(): Unit = done match
    case last :: rest =>
      last.undo()
      done = rest
    case Nil => ()

@main def strategyVsCommandCommand(): Unit =
  val doc = Document("weekly sales report")
  val history = EditHistory()
  history.run(TitleCaseCommand(doc))
  println(doc.text)
  history.run(UpperCaseCommand(doc))
  println(doc.text)
  history.undoLast()
  println(doc.text)
  history.undoLast()
  println(doc.text)
