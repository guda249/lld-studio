from typing import Callable

Record = dict[str, str]
Parser = Callable[[str], list[Record]]


def parse_csv(raw: str) -> list[Record]:
    header, *rows = raw.strip().splitlines()
    keys = header.split(",")
    return [dict(zip(keys, row.split(","))) for row in rows]


def run_import(raw: str, parse: Parser) -> list[Record]:
    # the fixed order lives here; the varying step is a function argument
    valid = [r for r in parse(raw) if r.get("id")]
    print(f"Saved {len(valid)} records")
    return valid


run_import("id,name\n1,Pen\n,Pencil\n3,Paper", parse_csv)
run_import("1|Pen\n2|Ink", lambda raw: [dict(zip(["id", "name"], line.split("|"))) for line in raw.splitlines()])
