import scala.collection.mutable

class Document(val title: String):
  val sections: mutable.ListBuffer[String] = mutable.ListBuffer.empty
  val metadata: mutable.Map[String, String] = mutable.Map.empty

def offerForPriya(): Document =
  val letter = Document("Offer Letter - Priya")
  letter.sections ++= List("Greeting", "Role", "Compensation", "Benefits", "Policies")
  letter.metadata ++= Map("dept" -> "HR", "confidential" -> "yes", "version" -> "7")
  letter

def offerForArjun(): Document =
  // the same long setup, copied by hand; it already drifted (no Benefits, old version)
  val letter = Document("Offer Letter - Arjun")
  letter.sections ++= List("Greeting", "Role", "Compensation", "Policies")
  letter.metadata ++= Map("dept" -> "HR", "confidential" -> "yes", "version" -> "6")
  letter

@main def prototypeProblem(): Unit =
  for doc <- List(offerForPriya(), offerForArjun()) do
    println(s"${doc.title}: ${doc.sections.size} sections, version ${doc.metadata("version")}")
