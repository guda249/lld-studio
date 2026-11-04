def readings(count: Int): Iterator[Int] = // pretend heart-rate sensor, one value at a time
  val pattern = Vector(72, 75, 250, 78, 80, 0, 82, 85, 83)
  def read(i: Int): Int =
    val bpm = pattern(i % pattern.size)
    println(s"  read #$i: $bpm bpm")
    bpm
  Iterator.range(0, count).map(read)

def plausible(values: Iterator[Int]): Iterator[Int] =
  values.filter(v => v >= 30 && v <= 220) // drop sensor glitches

def batches(values: Iterator[Int], size: Int): Iterator[List[Int]] =
  values.grouped(size).map(_.toList)

@main def vitalsDemo(): Unit =
  val pipeline = batches(plausible(readings(9)), size = 3)
  println("pipeline built, nothing read yet")
  for batch <- pipeline do
    val avg = batch.sum.toDouble / batch.size
    println(f"upload ${batch.mkString("[", ", ", "]")} avg $avg%.2f bpm")
