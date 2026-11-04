class QuestionPaper(val subject: String, var questions: List[String], var setName: String = "master"):
  def duplicate(): QuestionPaper = QuestionPaper(subject, questions, setName)

var loadCount = 0

def loadMasterPaper(): QuestionPaper =
  // stands in for slow work: reading the question bank, checking it, laying it out
  loadCount += 1
  val questions = (1 to 5).map(n => s"Q$n: physics problem $n").toList
  QuestionPaper("Physics", questions)

@main def paperDemo(): Unit =
  val master = loadMasterPaper() // the expensive step runs once

  val papers = List("A", "B", "C").zipWithIndex.map { (setName, shift) =>
    val paper = master.duplicate() // cheap copy instead of a fresh load
    paper.setName = setName
    paper.questions = paper.questions.drop(shift) ++ paper.questions.take(shift) // same questions, new order
    paper
  }

  for p <- papers do
    println(s"Set ${p.setName}: starts with ${p.questions.head}, ${p.questions.size} questions")
  println(s"Master paper loaded $loadCount time(s); master still starts with ${master.questions.head}")
