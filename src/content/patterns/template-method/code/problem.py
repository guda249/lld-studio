Record = dict[str, str]


class CsvImporter:
    def run(self, raw: str) -> list[Record]:
        header, *rows = raw.strip().splitlines()
        keys = header.split(",")
        records = [dict(zip(keys, row.split(","))) for row in rows]
        valid = [r for r in records if r.get("id")]        # copy 1 of validation
        print(f"Saved {len(valid)} records")               # copy 1 of saving
        return valid


class KeyValueImporter:
    def run(self, raw: str) -> list[Record]:
        records = []
        for line in raw.strip().splitlines():
            pairs = [part.split("=", 1) for part in line.split(";")]
            records.append({p[0]: p[1] for p in pairs if len(p) == 2})
        valid = [r for r in records if r.get("id")]        # copy 2: a fix must be made twice
        print(f"Saved {len(valid)} records")               # copy 2
        return valid


CsvImporter().run("id,name\n1,Pen\n,Pencil\n3,Paper")
KeyValueImporter().run("id=1;name=Pen\nid=2")
