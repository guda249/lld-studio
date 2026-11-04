// Every marker loads its OWN copy of the same 50 KB image.
case class CarMarker(lat: Double, lng: Double, icon: Array[Byte], color: String)

def loadIcon(): Array[Byte] = Array.fill[Byte](50000)(0)

@main def flyweightProblem(): Unit =
  val markers = (0 until 200).map(i => CarMarker(17.38 + i * 1e-4, 78.48, loadIcon(), "yellow"))
  val copies = markers.map(m => System.identityHashCode(m.icon)).distinct.size
  val totalMb = markers.map(_.icon.length.toLong).sum / 1000000.0
  println(f"${markers.size} markers hold $copies separate copies of one icon: $totalMb%.1f MB")
  println(f"At 100,000 cars that would be ${100000L * 50000 / 1e9}%.1f GB")
