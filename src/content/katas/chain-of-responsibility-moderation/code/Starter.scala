val bannedWords = Set("scam", "crypto-giveaway")

// authorDays: how long the author has had an account
case class Post(authorDays: Int, text: String)

// Every rule lives in this one function, in a fixed order.
def moderate(post: Post): String =
  if post.text.trim.isEmpty then "rejected: empty post"
  else if bannedWords.exists(w => post.text.toLowerCase.contains(w)) then "rejected: banned word"
  else if post.authorDays < 3 && post.text.contains("http") then "held: new account posting a link"
  else if post.text.length > 280 then "held: too long, needs a human look"
  else "published"

@main def demo(): Unit =
  val posts = List(
    Post(40, "Great meetup tonight!"),
    Post(40, "   "),
    Post(1, "Check http://example.com"),
    Post(90, "Free crypto-giveaway, DM me"),
    Post(12, "x" * 300)
  )
  for post <- posts do
    val label = "%-24s".format(s"'${post.text.take(20)}'")
    println(s"$label -> ${moderate(post)}")
