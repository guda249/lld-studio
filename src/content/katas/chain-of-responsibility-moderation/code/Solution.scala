val bannedWords = Set("scam", "crypto-giveaway")

// authorDays: how long the author has had an account
case class Post(authorDays: Int, text: String)

// One link of the chain: decide if you can, otherwise pass the post to the next link.
abstract class Moderator(next: Option[Moderator]):
  def verdict(post: Post): Option[String]

  def handle(post: Post): String =
    verdict(post).getOrElse(
      next.map(_.handle(post)).getOrElse("published") // nobody objected: the end of the chain
    )

class EmptyCheck(next: Option[Moderator] = None) extends Moderator(next):
  def verdict(post: Post): Option[String] =
    Option.when(post.text.trim.isEmpty)("rejected: empty post")

class BannedWordCheck(next: Option[Moderator] = None) extends Moderator(next):
  def verdict(post: Post): Option[String] =
    Option.when(bannedWords.exists(w => post.text.toLowerCase.contains(w)))("rejected: banned word")

class NewAccountLinkCheck(next: Option[Moderator] = None) extends Moderator(next):
  def verdict(post: Post): Option[String] =
    Option.when(post.authorDays < 3 && post.text.contains("http"))("held: new account posting a link")

class LengthCheck(next: Option[Moderator] = None) extends Moderator(next):
  def verdict(post: Post): Option[String] =
    Option.when(post.text.length > 280)("held: too long, needs a human look")

@main def demo(): Unit =
  // The client builds the chain; reordering or adding a step touches only this line.
  val chain = EmptyCheck(Some(BannedWordCheck(Some(NewAccountLinkCheck(Some(LengthCheck()))))))
  val posts = List(
    Post(40, "Great meetup tonight!"),
    Post(40, "   "),
    Post(1, "Check http://example.com"),
    Post(90, "Free crypto-giveaway, DM me"),
    Post(12, "x" * 300)
  )
  for post <- posts do
    val label = "%-24s".format(s"'${post.text.take(20)}'")
    println(s"$label -> ${chain.handle(post)}")
