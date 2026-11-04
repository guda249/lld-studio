class Document:
    def __init__(self, title: str) -> None:
        self.title = title
        self.sections: list[str] = []
        self.metadata: dict[str, str] = {}


def offer_for_priya() -> Document:
    letter = Document("Offer Letter - Priya")
    letter.sections += ["Greeting", "Role", "Compensation", "Benefits", "Policies"]
    letter.metadata.update({"dept": "HR", "confidential": "yes", "version": "7"})
    return letter


def offer_for_arjun() -> Document:
    # the same long setup, copied by hand; it already drifted (no Benefits, old version)
    letter = Document("Offer Letter - Arjun")
    letter.sections += ["Greeting", "Role", "Compensation", "Policies"]
    letter.metadata.update({"dept": "HR", "confidential": "yes", "version": "6"})
    return letter


for doc in (offer_for_priya(), offer_for_arjun()):
    print(f"{doc.title}: {len(doc.sections)} sections, version {doc.metadata['version']}")
