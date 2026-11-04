trait DocumentStore:
  def read(docId: String): String

class RealDocumentStore extends DocumentStore:
  println("Connecting to remote storage (slow)...")
  def read(docId: String): String = s"contents of $docId"

class DocumentStoreProxy(role: String) extends DocumentStore:
  private val allowedRoles = Set("admin", "editor")
  private var real: Option[RealDocumentStore] = None

  def read(docId: String): String =
    if !allowedRoles.contains(role) then                 // protection proxy
      throw SecurityException(s"$role cannot read $docId")
    if real.isEmpty then real = Some(RealDocumentStore()) // virtual proxy (lazy)
    real.get.read(docId)

// Client code: it only knows the DocumentStore interface.
def printDocument(store: DocumentStore, docId: String): Unit =
  try println(store.read(docId))
  catch case e: SecurityException => println(s"denied: ${e.getMessage}")

@main def proxyDemo(): Unit =
  val editor: DocumentStore = DocumentStoreProxy("editor")
  println("proxy created, nothing connected yet")
  printDocument(editor, "contract-42")                  // connects now, on first use
  printDocument(editor, "contract-43")                  // reuses the connection
  printDocument(DocumentStoreProxy("guest"), "contract-42") // never connects
