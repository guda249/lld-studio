type Record = Map[String, String]

def parseCsv(raw: String): List[Record] =
  val lines = raw.trim.linesIterator.toList
  val keys = lines.head.split(",").toList
  lines.tail.map(row => keys.zip(row.split(",", -1).toList).toMap)

// the fixed order lives here; the varying step is a function argument
def runImport(raw: String, parse: String => List[Record]): List[Record] =
  val valid = parse(raw).filter(_.get("id").exists(_.nonEmpty))
  println(s"Saved ${valid.size} records")
  valid

@main def idiomaticDemo(): Unit =
  runImport("id,name\n1,Pen\n,Pencil\n3,Paper", parseCsv)
  runImport("1|Pen\n2|Ink", raw => raw.linesIterator.toList.map(line => List("id", "name").zip(line.split('|').toList).toMap))
