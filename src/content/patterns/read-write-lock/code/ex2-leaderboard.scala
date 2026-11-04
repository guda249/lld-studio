class ReadWriteLock(val preferWriters: Boolean):
  private var readerCount = 0
  private var writing = false
  private var writersWaiting = 0

  def readers: Int = synchronized(readerCount)
  def waitingWriters: Int = synchronized(writersWaiting)

  def tryRead(): Boolean = synchronized:
    if writing || (preferWriters && writersWaiting > 0) then false // writer-first: a queued writer closes the door
    else
      readerCount += 1
      true

  def releaseRead(): Unit = synchronized:
    readerCount -= 1
    notifyAll()

  def write(): Unit = synchronized:
    writersWaiting += 1
    while writing || readerCount > 0 do wait()
    writersWaiting -= 1
    writing = true

  def releaseWrite(): Unit = synchronized:
    writing = false
    notifyAll()

// Thousands of players view it; one score updater changes it.
class Leaderboard(preferWriters: Boolean):
  val lock = ReadWriteLock(preferWriters)
  var scores: Map[String, Int] = Map("Priya" -> 8800, "Arjun" -> 9000)

  def update(player: String, score: Int): Unit =
    lock.write()
    try scores = scores.updated(player, score)
    finally lock.releaseWrite()

def run(preferWriters: Boolean, newViewers: Int): String =
  val board = Leaderboard(preferWriters)
  (1 to 2).foreach(_ => board.lock.tryRead()) // two players are already viewing
  val updater = Thread(() => board.update("Priya", 9100))
  updater.start()
  while board.lock.waitingWriters == 0 do Thread.sleep(1) // wait until the updater is queued
  val gotIn = (1 to newViewers).count(_ => board.lock.tryRead())
  (1 to board.lock.readers).foreach(_ => board.lock.releaseRead()) // everyone leaves; the updater can write
  updater.join()
  if gotIn > 0 then s"writer overtaken by $gotIn readers"
  else s"writer next; $newViewers readers wait"

@main def leaderboardDemo(): Unit =
  for (policy, preferWriters) <- List("reader-first" -> false, "writer-first" -> true); viewers <- List(2, 5) do
    println(s"$policy, $viewers new viewers: ${run(preferWriters, viewers)}")
  println("With a steady stream of viewers, reader-first may never let the updater in.")
