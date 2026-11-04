class RealDocumentStore:
  println("Connecting to remote storage (slow)...") // happens even if nobody reads
  def read(docId: String): String = s"contents of $docId"

// Every caller must remember this check. One forgotten copy is a data leak.
def showDocument(store: RealDocumentStore, role: String, docId: String): String =
  if !Set("admin", "editor").contains(role) then s"$role cannot read $docId"
  else store.read(docId)

def exportDocument(store: RealDocumentStore, role: String, docId: String): String =
  store.read(docId).toUpperCase // oops: this caller forgot the check

@main def proxyProblem(): Unit =
  val store = RealDocumentStore() // paid for up front
  println(showDocument(store, "guest", "contract-42"))
  println(exportDocument(store, "guest", "contract-42"))
