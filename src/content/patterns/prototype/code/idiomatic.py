from dataclasses import dataclass, replace


@dataclass(frozen=True)
class Document:
    title: str
    sections: tuple[str, ...]  # a tuple cannot be changed, so sharing it is safe
    metadata: tuple[tuple[str, str], ...]


OFFER = Document("Offer Letter", ("Greeting", "Role", "Compensation"), (("dept", "HR"),))

# replace() makes a changed copy; the template can never be edited by accident
letter = replace(OFFER, title="Offer Letter - Priya", sections=OFFER.sections + ("Joining date",))

print(f"{letter.title}: {len(letter.sections)} sections")
print(f"{OFFER.title}: {len(OFFER.sections)} sections")
print(f"Metadata shared, not copied: {letter.metadata is OFFER.metadata}")
