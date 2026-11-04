class RealDocumentStore:
    def __init__(self) -> None:
        print("Connecting to remote storage (slow)...")   # happens even if nobody reads

    def read(self, doc_id: str) -> str:
        return f"contents of {doc_id}"


# Every caller must remember this check. One forgotten copy is a data leak.
def show_document(store: RealDocumentStore, role: str, doc_id: str) -> str:
    if role not in {"admin", "editor"}:
        return f"{role} cannot read {doc_id}"
    return store.read(doc_id)


def export_document(store: RealDocumentStore, role: str, doc_id: str) -> str:
    return store.read(doc_id).upper()   # oops: this caller forgot the check


store = RealDocumentStore()             # paid for up front
print(show_document(store, "guest", "contract-42"))
print(export_document(store, "guest", "contract-42"))
