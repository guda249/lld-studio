from abc import ABC, abstractmethod


class DocumentStore(ABC):
    @abstractmethod
    def read(self, doc_id: str) -> str: ...


class RealDocumentStore(DocumentStore):
    def __init__(self) -> None:
        print("Connecting to remote storage (slow)...")

    def read(self, doc_id: str) -> str:
        return f"contents of {doc_id}"


class DocumentStoreProxy(DocumentStore):
    ALLOWED_ROLES = {"admin", "editor"}

    def __init__(self, role: str) -> None:
        self._role = role
        self._real: RealDocumentStore | None = None

    def read(self, doc_id: str) -> str:
        if self._role not in self.ALLOWED_ROLES:             # protection proxy
            raise PermissionError(f"{self._role} cannot read {doc_id}")
        if self._real is None:                                # virtual proxy (lazy)
            self._real = RealDocumentStore()
        return self._real.read(doc_id)


def print_document(store: DocumentStore, doc_id: str) -> None:
    """Client code: it only knows the DocumentStore interface."""
    try:
        print(store.read(doc_id))
    except PermissionError as error:
        print(f"denied: {error}")


editor: DocumentStore = DocumentStoreProxy(role="editor")
print("proxy created, nothing connected yet")
print_document(editor, "contract-42")    # connects now, on first use
print_document(editor, "contract-43")    # reuses the connection
print_document(DocumentStoreProxy(role="guest"), "contract-42")   # never connects
