import scala.collection.mutable

trait ChatMediator: // mediator interface
  def send(sender: String, text: String, to: Option[String]): Unit

class Member(val name: String): // colleague: knows only the mediator, never other members
  var room: Option[ChatMediator] = None
  val inbox = mutable.ListBuffer.empty[String]

  def say(text: String, to: Option[String] = None): Unit = room match
    case Some(r) => r.send(name, text, to)
    case None    => throw IllegalStateException(s"$name has not joined a room")

  def receive(sender: String, text: String): Unit = inbox += s"$sender: $text"

class ChatRoom extends ChatMediator: // concrete mediator: every routing rule lives here
  private val members = mutable.LinkedHashMap.empty[String, Member]
  private val muted = mutable.Set.empty[(String, String)] // (listener, sender)

  def join(member: Member): Unit =
    members(member.name) = member
    member.room = Some(this)

  def mute(listener: String, sender: String): Unit = muted += ((listener, sender))

  def send(sender: String, text: String, to: Option[String]): Unit =
    val targets = to match
      case Some(name) => members.get(name).toList
      case None       => members.values.filter(_.name != sender).toList
    for member <- targets do
      if !muted.contains((member.name, sender)) then member.receive(sender, text)

@main def mediatorDemo(): Unit =
  val room = ChatRoom()
  val asha = Member("asha")
  val ravi = Member("ravi")
  val meera = Member("meera")
  List(asha, ravi, meera).foreach(room.join)
  room.mute("asha", "ravi") // a new rule: one change, in the mediator only

  asha.say("Standup in 5 minutes") // to everyone else
  ravi.say("Can you review my PR?", Some("meera")) // direct message
  ravi.say("Lunch at 1?") // asha has muted ravi
  for m <- List(asha, ravi, meera) do
    println(s"${m.name.padTo(5, ' ')} inbox: ${m.inbox.mkString(" | ")}")
