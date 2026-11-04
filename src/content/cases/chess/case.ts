import type { CaseStudy } from "../../extras/types";
import python from "./code/main.py?raw";
import scala from "./code/Main.scala?raw";

const chess: CaseStudy = {
  slug: "chess",
  title: "Chess game",
  difficulty: 3,
  tagline: "Move rules per piece, turns, check detection and a small game state machine.",
  prompt:
    "Design a two-player chess game. Players take turns moving pieces; the game must reject illegal moves, notice when a king is in check, and let a player resign.",
  clarify: [
    { q: "Do we need a computer opponent?", a: "No. Two human players on one board; we only validate moves." },
    { q: "Which special rules are in scope: castling, en passant, promotion?", a: "None for this version. They are extension work; the design must leave room for them." },
    { q: "Do we detect check and checkmate?", a: "Check, yes: a move that leaves your own king attacked is rejected, and the status shows CHECK. Checkmate and stalemate detection are a follow-up." },
    { q: "How are moves given?", a: "As two square names, like e2 and e4. No algebraic notation parsing (Nf3) for now." },
    { q: "Can a player take back a move?", a: "Yes, one at a time, until the game is over." }
  ],
  requirements: {
    functional: [
      "Set up the standard starting position",
      "Accept a move only if it is that colour's turn and the piece can move that way",
      "Sliding pieces (rook, bishop, queen) cannot jump over pieces; knights can",
      "Pawns move one forward, two from their start rank, and capture one diagonally forward",
      "Reject a move that leaves the mover's own king in check, and report CHECK to the other side",
      "Undo the last move, and resign"
    ],
    nonFunctional: [
      "Adding a new piece type does not change Board or Game",
      "Each move is checked in well under a millisecond (64 squares, no search)",
      "Deterministic: the demo replays a fixed list of moves"
    ],
    outOfScope: ["Castling, en passant, promotion", "Checkmate, stalemate and draw rules (50 moves, repetition)", "Clocks, networking, AI opponent"]
  },
  entities: [
    { name: "Game", responsibility: "Owns the board, whose turn it is, the status and the move history; applies the rules in order." },
    { name: "Board", responsibility: "Which piece is on which square; answers path-clear and in-check questions." },
    { name: "Piece", responsibility: "The shared move checks (on the board, not onto your own piece), then its own shape rule." },
    { name: "Pawn", responsibility: "The trickiest shape: direction depends on colour, double step from the start, diagonal captures." },
    { name: "Knight", responsibility: "An L-shaped jump that ignores pieces in between." },
    { name: "Move", responsibility: "One move that can apply itself and undo itself, remembering any captured piece." },
    { name: "Color", responsibility: "WHITE or BLACK, and who the opponent is." },
    { name: "Status", responsibility: "The game state: ACTIVE, CHECK, RESIGNED or DRAW." }
  ],
  uml: {
    classes: [
      { name: "Game", kind: "concrete", members: ["+ turn: Color", "+ status: Status", "- history: list", "+ move(src, dst): str", "+ undo()"] },
      { name: "Board", kind: "concrete", members: ["- grid: map of Piece", "+ at(sq)", "+ path_clear(src, dst)", "+ in_check(color)"] },
      { name: "Move", kind: "concrete", members: ["+ piece: Piece", "+ captured: Piece?", "+ execute(board)", "+ undo(board)"] },
      { name: "Piece", kind: "abstract", members: ["+ color: Color", "+ can_move(board, src, dst)", "# _shape_ok(…)"] },
      { name: "King", kind: "concrete" },
      { name: "Queen", kind: "concrete" },
      { name: "Rook", kind: "concrete" },
      { name: "Bishop", kind: "concrete" },
      { name: "Knight", kind: "concrete" },
      { name: "Pawn", kind: "concrete" },
      { name: "Color", kind: "enum", members: ["WHITE", "BLACK", "+ opponent()"] },
      { name: "Status", kind: "enum", members: ["ACTIVE", "CHECK", "RESIGNED", "DRAW"] }
    ],
    relations: [
      { from: "Game", to: "Board", type: "composition" },
      { from: "Game", to: "Move", type: "aggregation" },
      { from: "Game", to: "Color", type: "association" },
      { from: "Game", to: "Status", type: "association" },
      { from: "Board", to: "Piece", type: "aggregation" },
      { from: "Move", to: "Piece", type: "association" },
      { from: "Piece", to: "Color", type: "association" },
      { from: "Piece", to: "Board", type: "dependency" },
      { from: "King", to: "Piece", type: "inheritance" },
      { from: "Queen", to: "Piece", type: "inheritance" },
      { from: "Rook", to: "Piece", type: "inheritance" },
      { from: "Bishop", to: "Piece", type: "inheritance" },
      { from: "Knight", to: "Piece", type: "inheritance" },
      { from: "Pawn", to: "Piece", type: "inheritance" }
    ]
  },
  flow: {
    title: "Black tries Ke8-e7 while in check (rejected)",
    sequence: {
      label: "Player calls Game.move; Game asks the King if it can move, executes a Move on the Board, asks the Board whether black is in check, and because it is, undoes the Move and rejects it.",
      participants: [
        { id: "player", name: "Player", kind: "client" },
        { id: "game", name: "Game", kind: "concrete" },
        { id: "king", name: "King", kind: "concrete" },
        { id: "move", name: "Move", kind: "concrete" },
        { id: "board", name: "Board", kind: "concrete" }
      ],
      messages: [
        { from: "player", to: "game", label: "move(\"e8\", \"e7\")" },
        { from: "game", to: "king", label: "can_move(board, e8, e7)" },
        { from: "king", to: "game", label: "true", kind: "return" },
        { from: "game", to: "move", label: "Move(e8, e7, king)", kind: "create" },
        { from: "move", to: "board", label: "execute: put pieces" },
        { from: "game", to: "board", label: "in_check(BLACK)" },
        { from: "board", to: "game", label: "true", kind: "return" },
        { from: "move", to: "board", label: "undo: restore squares" },
        { from: "game", to: "player", label: "rejected: leaves king in check", kind: "return" }
      ]
    }
  },
  states: {
    name: "Game status",
    states: ["ACTIVE", "CHECK", "RESIGNED", "DRAW"],
    transitions: [
      { from: "ACTIVE", to: "CHECK", on: "a move attacks the other king" },
      { from: "CHECK", to: "ACTIVE", on: "a move gets the king out of check" },
      { from: "ACTIVE", to: "RESIGNED", on: "resign()" },
      { from: "CHECK", to: "RESIGNED", on: "resign()" },
      { from: "ACTIVE", to: "DRAW", on: "both players agree to a draw" }
    ]
  },
  patterns: [
    {
      slug: "template-method",
      where: "Piece.can_move (fixed steps) calls the abstract _shape_ok that King, Queen, Rook, Bishop, Knight and Pawn fill in",
      why: "Every piece shares the same first checks (stay on the board, never land on your own piece). Writing them once means a new piece only describes its shape."
    },
    {
      slug: "command",
      where: "Move.execute and Move.undo, kept in Game's history",
      why: "Check detection needs 'try the move, look, take it back', and players want undo. A Move that remembers what it captured gives both for free."
    }
  ],
  code: { python, scala },
  tradeoffs: [
    "We chose a small Status enum with the transitions in Game over the full State pattern because there are only four states and only Game.move and resign change them; State classes would add six classes for a handful of if-checks.",
    "We chose to detect 'leaves own king in check' by executing the move and undoing it over computing pins and attack lines, because it reuses the normal move rules and cannot disagree with them.",
    "We chose a dictionary of occupied squares over an 8×8 array because empty squares cost nothing and 'which pieces are there' is a simple loop.",
    "We chose one subclass per piece (Template Method) over one big if/elif on piece type because each rule then lives in a few lines next to its piece, and a new fairy piece is a new class.",
    "We left checkmate out on purpose: it needs 'does any legal move exist', which is easy to brute-force but is a separate feature with its own tests."
  ],
  followUps: [
    { q: "How would you detect checkmate and stalemate?", a: "After each move, ask: does the side to move have any legal move? Try every own piece to every square with the same execute-check-undo step. None and in check: checkmate. None and not in check: stalemate. At most 16 × 64 tries, fast enough." },
    { q: "How would you add castling?", a: "King's shape rule allows two squares sideways if neither king nor rook has moved, the path is clear and the king doesn't pass through an attacked square. Move needs a second piece to move (the rook), so make a CastleMove subclass with its own execute and undo." },
    { q: "How do you support en passant?", a: "It needs the last move. Game passes its history (or the last Move) into the check, and an EnPassantMove captures a piece on a different square than it lands on, so its undo restores that square." },
    { q: "How would you play over the network?", a: "Keep Game as the single source of truth on a server. Clients send (src, dst); the server validates, applies and broadcasts the new state. The design doesn't change, only who calls move." },
    { q: "How would you save and replay a game?", a: "The history is already a list of Move commands. Store them as square pairs (e2e4…) and replay them through Game.move on a fresh board." }
  ],
  extend: [
    "Add has_legal_move(color) to Game and set the status to CHECKMATE or STALEMATE after each move.",
    "Add pawn promotion: a pawn reaching the last rank becomes a Queen, and undo turns it back into a pawn.",
    "Add offer_draw() and accept_draw() to reach the DRAW state, and reject moves after it.",
    "Print the move list in simple notation (e2-e4, Bf1-c4, Qh5xf7+) from the history of Move objects."
  ],
  quiz: [
    {
      type: "mcq", tag: "Concept",
      prompt: "Why does Game execute a Move and then undo it before accepting it?",
      options: [
        "To check whether the move leaves the mover's own king in check",
        "To find out if the piece is allowed to move in that shape",
        "To print the board before and after"
      ],
      answer: 0,
      hint: "The piece's own rules are checked by can_move first. What can only be seen once the move is made?",
      explain: "Shape rules are checked by can_move before anything moves. Some moves have a legal shape but expose your king (a pinned piece, or a king stepping into an attacked square). Playing the move, asking in_check, and undoing it catches all of those. Printing has nothing to do with it."
    },
    {
      type: "bug", tag: "Find the problem",
      prompt: "This bishop can jump over pieces. Tap the line that is wrong.",
      code: { lang: "python", text: `class Bishop(Piece):
    letter = "B"

    def _shape_ok(self, board, src, dst, dx, dy, capture):
        return abs(dx) == abs(dy)` },
      answer: 5,
      hint: "Compare with the rook and queen: what else do sliding pieces need to check?",
      explain: "Line 5 checks only the diagonal shape. A bishop slides, so every square between src and dst must be empty: add `and board.path_clear(src, dst)`. Only the knight may ignore pieces in between."
    },
    {
      type: "mcq", tag: "Which pattern?",
      prompt: "Piece.can_move does the shared checks in a fixed order and then calls _shape_ok, which each piece overrides. Which pattern is that?",
      options: ["Template Method", "Strategy", "State", "Command"],
      answer: 0,
      hint: "Is the varying step chosen by a held object, or filled in by a subclass inside a fixed skeleton?",
      explain: "A base-class method with fixed steps that calls an abstract step subclasses fill in: Template Method. Strategy would hold a separate movement object; State would change behaviour as the game's status changes; Command is the Move class."
    },
    {
      type: "order", tag: "Put in order",
      prompt: "Put Game.move's checks in the order the code runs them.",
      steps: [
        "Reject if the game is over",
        "Reject if there is no piece on the source square",
        "Reject if the piece is not the current player's",
        "Reject if the piece can't move in that shape",
        "Execute the move and reject (undo) if it leaves your own king in check"
      ],
      shuffled: [4, 2, 0, 3, 1],
      hint: "Cheap checks come first; the expensive try-and-undo comes last.",
      explain: "Game-over and empty-square checks need no thinking, then whose turn, then the piece's shape rule, and only then the try-and-undo king safety check, which is the most work."
    }
  ]
};

export default chess;
