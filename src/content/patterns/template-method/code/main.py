from abc import ABC, abstractmethod

Record = dict[str, str]


class DataImporter(ABC):
    def run(self, raw: str) -> list[Record]:          # the template method (don't override)
        records = self.parse(raw)
        valid = [r for r in records if self.is_valid(r)]
        self.save(valid)
        return valid

    @abstractmethod
    def parse(self, raw: str) -> list[Record]: ...    # required step

    def is_valid(self, record: Record) -> bool:       # hook with a default
        return bool(record.get("id"))

    def save(self, records: list[Record]) -> None:    # hook with a default
        print(f"Saved {len(records)} records: {[r['id'] for r in records]}")


class CsvImporter(DataImporter):
    def parse(self, raw: str) -> list[Record]:
        header, *rows = raw.strip().splitlines()
        keys = header.split(",")
        return [dict(zip(keys, row.split(","))) for row in rows]


class KeyValueImporter(DataImporter):                 # lines like: id=1;name=Pen
    def parse(self, raw: str) -> list[Record]:
        records = []
        for line in raw.strip().splitlines():
            pairs = [part.split("=", 1) for part in line.split(";")]
            records.append({p[0]: p[1] for p in pairs if len(p) == 2})
        return records

    def is_valid(self, record: Record) -> bool:       # overrides the hook
        return super().is_valid(record) and "name" in record


CsvImporter().run("id,name\n1,Pen\n,Pencil\n3,Paper")     # the row with no id is dropped
KeyValueImporter().run("id=1;name=Pen\nid=2")             # the record with no name is dropped
