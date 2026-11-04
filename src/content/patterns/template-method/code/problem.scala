type Record = Map[String, String]

class CsvImporter:
  def run(raw: String): List[Record] =
    val lines = raw.trim.linesIterator.toList
    val keys = lines.head.split(",").toList
    val records = lines.tail.map(row => keys.zip(row.split(",", -1).toList).toMap)
    val valid = records.filter(_.get("id").exists(_.nonEmpty))   // copy 1 of validation
    println(s"Saved ${valid.size} records")                     // copy 1 of saving
    valid

class KeyValueImporter:
  def run(raw: String): List[Record] =
    val records = raw.trim.linesIterator.toList.map { line =>
      line.split(";").toList.map(_.split("=", 2).toList).collect { case List(k, v) => k -> v }.toMap
    }
    val valid = records.filter(_.get("id").exists(_.nonEmpty))   // copy 2: a fix must be made twice
    println(s"Saved ${valid.size} records")                     // copy 2
    valid

@main def problemDemo(): Unit =
  CsvImporter().run("id,name\n1,Pen\n,Pencil\n3,Paper")
  KeyValueImporter().run("id=1;name=Pen\nid=2")
