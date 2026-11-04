import scala.collection.mutable

class NotAllowed(msg: String) extends RuntimeException(msg)

trait DocState:                                        // state
  def name: String

  def submit(doc: Document, user: String): DocState =
    throw NotAllowed(s"$user cannot submit a $name document")

  def approve(doc: Document, user: String): DocState =
    throw NotAllowed(s"$user cannot approve a $name document")

  def reject(doc: Document, user: String, reason: String): DocState =
    throw NotAllowed(s"$user cannot reject a $name document")

class Draft extends DocState:
  val name = "draft"

  override def submit(doc: Document, user: String): DocState =
    if user != doc.author then super.submit(doc, user)   // only the author may submit
    else InReview()

class InReview extends DocState:
  val name = "in review"

  override def approve(doc: Document, user: String): DocState =
    if user == doc.author then throw NotAllowed("authors cannot approve their own work")
    else Published()

  override def reject(doc: Document, user: String, reason: String): DocState =
    doc.notes += s"$user: $reason"
    Draft()

class Published extends DocState:
  val name = "published"

class Document(val title: String, val author: String):  // context
  val notes = mutable.ListBuffer.empty[String]
  var state: DocState = Draft()

  def act(action: String, user: String, reason: String = ""): Unit =
    try
      state = action match
        case "submit" => state.submit(this, user)
        case "approve" => state.approve(this, user)
        case _ => state.reject(this, user, reason)
      println(f"$user%-6s $action%-8s -> ${state.name}")
    catch
      case err: NotAllowed => println(f"$user%-6s $action%-8s -> refused: ${err.getMessage}")

@main def documentReview(): Unit =
  val doc = Document("Monsoon travel guide", author = "Asha")
  doc.act("submit", "Asha")
  doc.act("approve", "Asha")
  doc.act("reject", "Vikram", reason = "add train timings")
  doc.act("submit", "Vikram")
  doc.act("submit", "Asha")
  doc.act("approve", "Vikram")
  doc.act("reject", "Vikram", reason = "typo")
  println(s"Review notes: ${doc.notes.mkString("[", ", ", "]")}")
