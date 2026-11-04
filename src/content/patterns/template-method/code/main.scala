type Record = Map[String, String]

abstract class DataImporter:
  final def run(raw: String): List[Record] =             // the template method
    val records = parse(raw)
    val valid = records.filter(isValid)
    save(valid)
    valid

  protected def parse(raw: String): List[Record]         // required step

  protected def isValid(r: Record): Boolean =            // hook with a default
    r.get("id").exists(_.nonEmpty)

  protected def save(rs: List[Record]): Unit =           // hook with a default
    println(s"Saved ${rs.size} records: ${rs.map(_("id"))}")

class CsvImporter extends DataImporter:
  protected def parse(raw: String): List[Record] =
    raw.trim.linesIterator.toList match
      case header :: rows =>
        val keys = header.split(",").toList
        rows.map(row => keys.zip(row.split(",", -1).toList).toMap)
      case Nil => Nil

class KeyValueImporter extends DataImporter:             // lines like: id=1;name=Pen
  protected def parse(raw: String): List[Record] =
    raw.trim.linesIterator.toList.map(parseLine)

  private def parseLine(line: String): Record =
    line.split(";").toList.map(_.split("=", 2).toList).collect {
      case List(k, v) => k -> v
    }.toMap

  override protected def isValid(r: Record): Boolean =   // overrides the hook
    super.isValid(r) && r.contains("name")

@main def templateMethodDemo(): Unit =
  CsvImporter().run("id,name\n1,Pen\n,Pencil\n3,Paper")  // the row with no id is dropped
  KeyValueImporter().run("id=1;name=Pen\nid=2")          // the record with no name is dropped
