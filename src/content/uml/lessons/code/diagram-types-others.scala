val structure = List("Class", "Object", "Package", "Component",
  "Composite structure", "Deployment", "Profile")
val behaviour = List("Use case", "Activity", "State machine", "Sequence",
  "Communication", "Timing", "Interaction overview")
val lldFive = Set("Class", "Sequence", "State machine", "Activity", "Use case")

@main def demo(): Unit =
  val others = (structure ++ behaviour).filterNot(lldFive)
  println(s"${(structure ++ behaviour).size} diagram types")   // 14 diagram types
  println(s"${others.size} you will rarely draw: ${others.mkString(", ")}")
